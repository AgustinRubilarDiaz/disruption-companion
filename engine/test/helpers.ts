import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../src/http/server.js';

export async function startApp(): Promise<{ base: string; close: () => Promise<void> }> {
  const server: Server = createApp(undefined, () => {});
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

export async function getAssessment(base: string, bookingId: string) {
  const res = await fetch(`${base}/v1/bookings/${bookingId}/disruption-assessment`);
  return { status: res.status, headers: res.headers, body: (await res.json()) as any };
}
