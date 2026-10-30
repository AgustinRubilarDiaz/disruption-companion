import { useCallback, useEffect, useState } from 'react';
import { TEXT } from './copy';
import type { Api, Assessment, RebookingResponse, ScenarioInfo } from './types';
import { formatCountdown, toViewModel, type ViewModel } from './viewModel';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ok'; assessment: Assessment };
type Accept =
  | { step: 'idle' }
  | { step: 'confirm' }
  | { step: 'sending' }
  | { step: 'done'; result: RebookingResponse };

export function App({ api }: { api: Api }) {
  const [scenarios, setScenarios] = useState<ScenarioInfo[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [booking, setBooking] = useState('');

  useEffect(() => {
    let live = true;
    api.scenarios().then(
      (s) => {
        if (!live) return;
        setScenarios(s);
        setBooking(s[0]?.booking_id ?? '');
      },
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [api]);

  const current = scenarios?.find((s) => s.booking_id === booking);

  return (
    <main className="shell">
      <header className="top">
        <h1>Estado de tu viaje</h1>
        {scenarios && (
          <label className="picker">
            Reserva
            <select value={booking} onChange={(e) => setBooking(e.target.value)}>
              {scenarios.map((s) => (
                <option key={s.booking_id} value={s.booking_id}>
                  {s.booking_id}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>
      {current && (
        <p className="demo" data-testid="demo-note">
          {current.description}. Demostración con reloj simulado ({current.simulated_clock.replace('T', ' ').replace('Z', ' UTC')}).
        </p>
      )}
      {failed && <p role="alert" className="error">{TEXT.loadError}</p>}
      {booking && <Trip key={booking} api={api} bookingId={booking} />}
    </main>
  );
}

function Trip({ api, bookingId }: { api: Api; bookingId: string }) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const [accept, setAccept] = useState<Accept>({ step: 'idle' });

  useEffect(() => {
    let live = true;
    setLoad({ status: 'loading' });
    setAccept({ step: 'idle' });
    api.assessment(bookingId).then(
      (assessment) => live && setLoad({ status: 'ok', assessment }),
      () => live && setLoad({ status: 'error' }),
    );
    return () => {
      live = false;
    };
  }, [api, bookingId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  if (load.status === 'loading') return <p className="loading">Cargando…</p>;
  if (load.status === 'error') {
    return (
      <div>
        <p role="alert" className="error">{TEXT.loadError}</p>
        <button type="button" onClick={refresh}>{TEXT.refresh}</button>
      </div>
    );
  }

  const { assessment } = load;
  const vm = toViewModel(assessment);

  const send = async (optionId: string) => {
    setAccept({ step: 'sending' });
    try {
      const result = await api.requestRebooking(bookingId, { decision_id: assessment.decision_id, option_id: optionId });
      setAccept({ step: 'done', result });
    } catch {
      setAccept({ step: 'done', result: { kind: 'rejected', code: 'OTHER' } });
    }
  };

  return (
    <article className={`card kind-${vm.kind.toLowerCase()}`}>
      <Section title="Alerta" tone="alert">{vm.alert}</Section>
      {vm.impact && <Section title="Impacto">{vm.impact}</Section>}
      <Section title="Siguiente paso">
        <p>{vm.next}</p>
        {vm.canAccept && vm.option && (
          <Offer vm={vm} accept={accept} setAccept={setAccept} send={send} resetKey={tick} />
        )}
        {accept.step === 'done' && <Result result={accept.result} />}
      </Section>
      {vm.notice && <Section title="Aviso">{vm.notice}</Section>}
      <footer>
        {vm.reference && <span>{vm.reference}</span>}
        {vm.dataAsOf && <span>{vm.dataAsOf}</span>}
        <button type="button" className="link" onClick={refresh}>{TEXT.refresh}</button>
      </footer>
    </article>
  );
}

function Section({ title, tone, children }: { title: string; tone?: 'alert'; children: React.ReactNode }) {
  return (
    <section className={`section ${tone ?? ''}`}>
      <h2>{title}</h2>
      {typeof children === 'string' ? <p>{children}</p> : children}
    </section>
  );
}

function useCountdown(total: number, resetKey: number): number {
  const [left, setLeft] = useState(total);
  useEffect(() => {
    setLeft(total);
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [total, resetKey]);
  return left;
}

function Offer({
  vm,
  accept,
  setAccept,
  send,
  resetKey,
}: {
  vm: ViewModel;
  accept: Accept;
  setAccept: (a: Accept) => void;
  send: (optionId: string) => void;
  resetKey: number;
}) {
  const option = vm.option!;
  const left = useCountdown(option.validForSeconds, resetKey);
  const expired = left <= 0;

  if (accept.step === 'done') return null; // el resultado reemplaza al botón
  if (accept.step === 'sending') return <p role="status">{TEXT.sending}</p>;

  if (accept.step === 'confirm' && !expired) {
    return (
      <div className="confirm" role="alertdialog" aria-label="Confirmar cambio">
        <p>{option.confirmText}</p>
        <button type="button" className="primary" onClick={() => send(option.optionId)}>{TEXT.confirmYes}</button>
        <button type="button" onClick={() => setAccept({ step: 'idle' })}>{TEXT.confirmNo}</button>
      </div>
    );
  }

  return (
    <div className="offer">
      <button type="button" className="primary" disabled={expired} onClick={() => setAccept({ step: 'confirm' })}>
        {TEXT.accept}
      </button>
      {expired ? (
        <p role="status" className="error">{TEXT.expired}</p>
      ) : (
        <span className="countdown" aria-label="Tiempo restante de la opción">{formatCountdown(left)}</span>
      )}
    </div>
  );
}

function Result({ result }: { result: RebookingResponse }) {
  if (result.kind === 'confirming') return <p role="status" className="result">{TEXT.confirming}</p>;
  if (result.kind === 'rejected') {
    const text = result.code === 'OPTION_EXPIRED' ? TEXT.expired : result.code === 'OPTION_NOT_RECOMMENDED' ? TEXT.rejected : TEXT.failed;
    return <p role="alert" className="error">{text}</p>;
  }
  return (
    <div role="status" className="result ok">
      <p>{TEXT.requested(result.expires_at ? result.expires_at.slice(11, 16) : undefined)}</p>
      <p>{TEXT.requestRef(result.request_id)}</p>
    </div>
  );
}
