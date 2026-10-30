import { useCallback, useEffect, useRef, useState } from 'react';
import { Compare } from './components/Compare';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DemoBar } from './components/DemoBar';
import { Skeleton } from './components/Skeleton';
import { StatusHero } from './components/StatusHero';
import { Timeline } from './components/Timeline';
import { ValidityBar } from './components/ValidityBar';
import { CheckIcon } from './components/icons';
import { TEXT } from './copy';
import type { Api, Assessment, RebookingResponse, ScenarioInfo } from './types';
import { toViewModel, type ViewModel } from './viewModel';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ok'; assessment: Assessment };
type Accept =
  | { step: 'idle' }
  | { step: 'confirm' }
  | { step: 'sending' }
  | { step: 'done'; result: RebookingResponse };

function bookingFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('booking');
}

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
        const wanted = bookingFromUrl();
        setBooking(s.some((x) => x.booking_id === wanted) ? wanted! : (s[0]?.booking_id ?? ''));
      },
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [api]);

  const choose = (id: string) => {
    setBooking(id);
    window.history.replaceState(null, '', `?booking=${encodeURIComponent(id)}`);
  };

  return (
    <div className="min-h-dvh bg-stone-100 font-sans text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      {scenarios && <DemoBar scenarios={scenarios} booking={booking} onChange={choose} />}
      <main className="mx-auto max-w-xl px-4 pb-16 pt-6" data-testid="passenger-view">
        <header className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-100">Disruption Companion</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Estado de tu viaje</h1>
          {booking && <p className="text-sm text-stone-500 dark:text-stone-400">{TEXT.bookingCode(booking)}</p>}
        </header>
        {failed && <p role="alert" className="text-warn-700">{TEXT.loadError}</p>}
        {booking && <Trip key={booking} api={api} bookingId={booking} />}
      </main>
    </div>
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

  if (load.status === 'loading') return <Skeleton />;
  if (load.status === 'error') {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <p role="alert" className="text-warn-700 dark:text-warn-500">{TEXT.loadError}</p>
        <button type="button" onClick={refresh} className={SECONDARY}>{TEXT.refresh}</button>
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
    <div className="space-y-4">
      <StatusHero title={vm.hero.title} tone={vm.hero.tone} alert={vm.alert} />

      <Card title={vm.impact ? 'Impacto' : 'Tu itinerario'}>
        {vm.impact && <p className="font-medium">{vm.impact}</p>}
        <Timeline legs={vm.itinerary.legs} missedAfter={vm.itinerary.missedAfter} />
      </Card>

      <Card title="Siguiente paso">
        <p>{vm.next}</p>
        {vm.compare && <Compare before={vm.compare.before} after={vm.compare.after} />}
        {vm.canAccept && vm.option && (
          <Offer vm={vm} accept={accept} setAccept={setAccept} send={send} resetKey={tick} />
        )}
        {accept.step === 'done' && <Result result={accept.result} />}
      </Card>

      {vm.notice && <Card title="Aviso"><p>{vm.notice}</p></Card>}

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-stone-500 dark:text-stone-400">
        {vm.reference && <span>{vm.reference}</span>}
        {vm.dataAsOf && <span>{vm.dataAsOf}</span>}
        <button type="button" onClick={refresh} className="ml-auto font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-100">
          {TEXT.refresh}
        </button>
      </footer>
    </div>
  );
}

const SECONDARY =
  'mt-3 rounded-xl border border-stone-300 px-4 py-2 font-medium hover:bg-stone-50 dark:border-stone-600 dark:hover:bg-stone-800';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-colors dark:border-stone-800 dark:bg-stone-900">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{title}</h2>
      <div className="text-stone-800 dark:text-stone-100">{children}</div>
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
  const button = useRef<HTMLButtonElement>(null);
  const prevStep = useRef(accept.step);

  useEffect(() => {
    if (prevStep.current === 'confirm' && accept.step === 'idle') button.current?.focus();
    prevStep.current = accept.step;
  }, [accept.step]);

  if (accept.step === 'done') return null; // el resultado reemplaza al botón
  if (accept.step === 'sending') return <p role="status" className="mt-4 text-stone-600 dark:text-stone-300">{TEXT.sending}</p>;

  return (
    <div className="mt-4">
      <button
        ref={button}
        type="button"
        disabled={expired}
        onClick={() => setAccept({ step: 'confirm' })}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 dark:disabled:bg-stone-700 dark:disabled:text-stone-400"
      >
        {TEXT.accept}
      </button>
      <ValidityBar total={option.validForSeconds} left={left} />
      {accept.step === 'confirm' && !expired && (
        <ConfirmDialog text={option.confirmText} onConfirm={() => send(option.optionId)} onCancel={() => setAccept({ step: 'idle' })} />
      )}
    </div>
  );
}

function Result({ result }: { result: RebookingResponse }) {
  if (result.kind === 'confirming') return <p role="status" className="mt-4 font-medium">{TEXT.confirming}</p>;
  if (result.kind === 'rejected') {
    const text = result.code === 'OPTION_EXPIRED' ? TEXT.expired : result.code === 'OPTION_NOT_RECOMMENDED' ? TEXT.rejected : TEXT.failed;
    return <p role="alert" className="mt-4 font-medium text-warn-700 dark:text-warn-500">{text}</p>;
  }
  return (
    <div role="status" className="mt-4 flex gap-3 rounded-xl bg-ok-50 p-4 text-ok-600 dark:bg-ok-600/15">
      <CheckIcon className="size-6 shrink-0" />
      <div>
        <p className="font-semibold">{TEXT.requested(result.expires_at ? result.expires_at.slice(11, 16) : undefined)}</p>
        <p className="text-sm">{TEXT.requestRef(result.request_id)}</p>
      </div>
    </div>
  );
}
