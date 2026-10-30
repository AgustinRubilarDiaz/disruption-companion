import { TEXT } from '../copy';
import type { ScenarioInfo } from '../types';

/** Andamiaje de la demo, separado de la vista del pasajero: en producción el pasajero llega con su reserva. */
export function DemoBar({
  scenarios,
  booking,
  onChange,
}: {
  scenarios: ScenarioInfo[];
  booking: string;
  onChange: (id: string) => void;
}) {
  const current = scenarios.find((s) => s.booking_id === booking);
  return (
    <aside
      aria-label={TEXT.demoMode}
      data-testid="demo-bar"
      className="border-b border-dashed border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="mx-auto flex max-w-xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <span className="rounded bg-amber-400 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-950">{TEXT.demoMode}</span>
        <label className="flex items-center gap-2">
          <span className="sr-only">{TEXT.demoPicker}</span>
          <select
            aria-label={TEXT.demoPicker}
            value={booking}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-md border border-amber-300 bg-white px-2 py-1 text-amber-950 dark:border-amber-700 dark:bg-stone-900 dark:text-amber-100"
          >
            {scenarios.map((s) => (
              <option key={s.booking_id} value={s.booking_id}>
                {s.booking_id}
              </option>
            ))}
          </select>
        </label>
        {current && <span data-testid="demo-clock">{TEXT.simulatedClock(current.simulated_clock)}</span>}
        {current && <span className="w-full text-xs opacity-80" data-testid="demo-note">{current.description}</span>}
      </div>
    </aside>
  );
}
