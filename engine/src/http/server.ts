import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MockState, MockTools, fixedClock } from '../adapters/mock/mockTools.js';
import { SCENARIOS, type Scenario } from '../adapters/mock/scenarios.js';
import { BookingNotFound, assessDisruption, type Deps } from '../app/orchestrator.js';
import { requestRebooking } from '../app/rebooking.js';
import { DEFAULT_CONFIG, type EngineConfig } from '../domain/types.js';

const BOOKING_ID = /^[A-Z0-9]{5,10}$/;
const ASSESSMENT_PATH = /^\/v1\/bookings\/([^/]+)\/disruption-assessment\/?$/;
const REBOOKING_PATH = /^\/v1\/bookings\/([^/]+)\/rebooking-requests\/?$/;
const MAX_BODY_BYTES = 10_000;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

export interface AppOptions {
  /** Directorio de la pantalla compilada. Por defecto `web/dist` en la raíz del repositorio. */
  staticDir?: string;
}

export function defaultStaticDir(): string {
  return process.env.WEB_DIR ?? fileURLToPath(new URL('../../../web/dist', import.meta.url));
}

export function createApp(
  cfg: EngineConfig = DEFAULT_CONFIG,
  log: (line: object) => void = defaultLog,
  options: AppOptions = {},
): Server {
  const ctx: Ctx = { cfg, log, state: new MockState(), staticDir: resolve(options.staticDir ?? defaultStaticDir()) };
  return createServer((req, res) => {
    handle(req, res, ctx).catch((err: unknown) => {
      log({ level: 'error', msg: 'unhandled', error: err instanceof Error ? err.message : String(err) });
      if (!res.headersSent) send(res, 500, { error: 'INTERNAL_ERROR' });
    });
  });
}

interface Ctx {
  cfg: EngineConfig;
  log: (line: object) => void;
  state: MockState;
  staticDir: string;
}

function depsFor(scenario: Scenario, ctx: Ctx): Deps {
  return {
    tools: new MockTools(scenario, ctx.state),
    clock: fixedClock(scenario.clock),
    cfg: ctx.cfg,
    decisionId: () => scenario.decision_id,
  };
}

async function handle(req: IncomingMessage, res: ServerResponse, ctx: Ctx) {
  const url = new URL(req.url ?? '/', 'http://localhost');

  const rebooking = REBOOKING_PATH.exec(url.pathname);
  if (rebooking) {
    if (req.method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    return handleRebooking(req, res, ctx, decodeURIComponent(rebooking[1]!));
  }

  if (req.method !== 'GET') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  if (url.pathname === '/health') return send(res, 200, { status: 'ok' });

  if (url.pathname === '/v1/scenarios') return send(res, 200, scenariosBody());

  const match = ASSESSMENT_PATH.exec(url.pathname);
  if (match) return handleAssessment(res, ctx, decodeURIComponent(match[1]!));

  if (!url.pathname.startsWith('/v1/') && serveStatic(res, ctx.staticDir, url.pathname)) return;
  if (url.pathname === '/') return send(res, 200, scenariosBody());
  return send(res, 404, { error: 'NOT_FOUND' });
}

function scenariosBody() {
  return {
    service: 'disruption-engine',
    contract: 'DisruptionAssessment v1.0',
    scenarios: [...SCENARIOS.values()].map((s) => ({
      booking_id: s.booking_id,
      description: s.description,
      simulated_clock: s.clock,
      assessment_url: `/v1/bookings/${s.booking_id}/disruption-assessment`,
    })),
  };
}

async function handleAssessment(res: ServerResponse, ctx: Ctx, bookingId: string) {
  if (!BOOKING_ID.test(bookingId)) return send(res, 400, { error: 'INVALID_BOOKING_ID' });
  const scenario = SCENARIOS.get(bookingId);
  if (!scenario) return send(res, 404, { error: 'BOOKING_NOT_FOUND' });

  try {
    const { assessment, record } = await assessDisruption(bookingId, depsFor(scenario, ctx));
    ctx.log({
      level: 'info',
      decision_id: record.decision_id,
      booking_ref: record.booking_ref,
      trip_status: assessment.trip_status,
      next_step: assessment.next_step,
      escalations: assessment.escalations.map((e) => e.reason),
    });
    return send(res, 200, assessment, { 'X-Simulated-Clock': scenario.clock });
  } catch (err) {
    if (err instanceof BookingNotFound) return send(res, 404, { error: 'BOOKING_NOT_FOUND' });
    ctx.log({ level: 'error', decision_id: scenario.decision_id, error: err instanceof Error ? err.message : String(err) });
    return send(res, 500, { error: 'INTERNAL_ERROR', decision_id: scenario.decision_id });
  }
}

async function handleRebooking(req: IncomingMessage, res: ServerResponse, ctx: Ctx, bookingId: string) {
  if (!BOOKING_ID.test(bookingId)) return send(res, 400, { error: 'INVALID_BOOKING_ID' });

  const body = await readJson(req);
  const optionId = (body as { option_id?: unknown } | null)?.option_id;
  const decisionId = (body as { decision_id?: unknown } | null)?.decision_id;
  if (typeof optionId !== 'string' || typeof decisionId !== 'string' || !optionId || !decisionId) {
    return send(res, 400, { error: 'INVALID_REQUEST' });
  }

  const scenario = SCENARIOS.get(bookingId);
  if (!scenario) return send(res, 404, { error: 'BOOKING_NOT_FOUND' });

  try {
    const outcome = await requestRebooking(bookingId, optionId, depsFor(scenario, ctx));
    ctx.log({ level: 'info', decision_id: decisionId, action: 'rebooking_request', http_status: outcome.status });
    return send(res, outcome.status, outcome.body, { 'X-Simulated-Clock': scenario.clock });
  } catch (err) {
    ctx.log({ level: 'error', decision_id: decisionId, error: err instanceof Error ? err.message : String(err) });
    return send(res, 500, { error: 'INTERNAL_ERROR', decision_id: decisionId });
  }
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolveBody) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        resolveBody(null);
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        resolveBody(null);
      }
    });
    req.on('error', () => resolveBody(null));
  });
}

/** Sirve la pantalla compilada. Devuelve false si no hay archivo, para que el llamador responda otra cosa. */
function serveStatic(res: ServerResponse, root: string, pathname: string): boolean {
  let rel: string;
  try {
    rel = normalize(decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
  } catch {
    return false;
  }
  const file = join(root, rel);
  if (file !== root && !file.startsWith(root + sep)) return false; // no salir del directorio
  if (!existsSync(file) || !statSync(file).isFile()) return false;
  const type = MIME[extname(file)] ?? 'application/octet-stream';
  const cache = file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache });
  res.end(readFileSync(file));
  return true;
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body, null, 2));
}

function defaultLog(line: object) {
  process.stdout.write(`${JSON.stringify({ ts: new Date().toISOString(), ...line })}\n`);
}
