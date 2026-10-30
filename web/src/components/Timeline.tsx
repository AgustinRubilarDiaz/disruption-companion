import { TEXT } from '../copy';
import type { Leg } from '../viewModel';
import { PlaneIcon } from './icons';

const BADGE: Record<Leg['status'], string> = {
  DELAYED: 'bg-warn-50 text-warn-700 ring-warn-500/30 dark:bg-warn-700/20 dark:text-warn-500',
  ON_TIME: 'bg-ok-50 text-ok-600 ring-ok-600/30 dark:bg-ok-600/20',
  SCHEDULED: 'bg-stone-100 text-stone-700 ring-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-600',
  UNVERIFIED: 'bg-stone-100 text-stone-700 ring-stone-400 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-500 border-dashed',
};

/** Itinerario: cada tramo con su estado. Sin confirmar → sólo lo programado. */
export function Timeline({ legs, missedAfter }: { legs: Leg[]; missedAfter?: string }) {
  return (
    <ol aria-label="Itinerario" data-testid="timeline" className="relative mt-3">
      {legs.map((l, i) => (
        <li key={l.segmentId} data-testid={`leg-${l.flight}`}>
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid size-8 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-100">
                <PlaneIcon className="size-4" />
              </span>
              {i < legs.length - 1 && (
                <span
                  className={`my-1 w-0.5 flex-1 ${missedAfter === l.segmentId ? 'bg-warn-500' : 'bg-stone-200 dark:bg-stone-700'}`}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-stone-900 dark:text-white">{l.flight}</span>
                <span className="text-stone-600 dark:text-stone-300">
                  {l.from} <span aria-hidden="true">→</span>
                  <span className="sr-only"> a </span> {l.to}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${BADGE[l.status]}`}>{l.statusLabel}</span>
              </div>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                {l.date}
                {l.scheduledDeparture && (
                  <>
                    {' · '}
                    {l.newDeparture ? (
                      <>
                        <span className="sr-only">Salida programada </span>
                        <s className="text-stone-400" data-testid="scheduled">{l.scheduledDeparture}</s>{' '}
                        <span className="sr-only">nueva salida </span>
                        <strong className="text-stone-900 dark:text-white" data-testid="new-departure">{l.newDeparture}</strong>
                      </>
                    ) : (
                      <span data-testid="scheduled">Sale {l.scheduledDeparture}</span>
                    )}
                  </>
                )}
                {l.delayLabel && <span className="ml-2 whitespace-nowrap font-medium text-warn-700 dark:text-warn-500">{l.delayLabel}</span>}
                {l.gate && <span className="ml-2 whitespace-nowrap">Puerta {l.gate}</span>}
              </p>
              {missedAfter === l.segmentId && (
                <p className="mt-2 inline-flex rounded-md bg-warn-500 px-2 py-0.5 text-xs font-semibold text-white" data-testid="missed">
                  {TEXT.missedConnection}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
