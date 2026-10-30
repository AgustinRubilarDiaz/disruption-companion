import { TEXT } from '../copy';
import type { FlightSlot } from '../viewModel';
import { ArrowIcon } from './icons';

function Slot({ label, slot, emphasis }: { label: string; slot: FlightSlot; emphasis?: boolean }) {
  return (
    <div
      className={`flex-1 rounded-xl border p-3 ${
        emphasis
          ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/60'
          : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</p>
      <p className={`mt-1 font-semibold ${emphasis ? 'text-brand-700 dark:text-brand-100' : 'text-stone-500 line-through dark:text-stone-400'}`}>
        {slot.flight}
      </p>
      <p className="text-sm text-stone-700 dark:text-stone-200">
        {slot.date}
        <span className="sr-only"> · </span>
      </p>
      <p className={`text-lg font-semibold tabular-nums ${emphasis ? 'text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400'}`}>
        {slot.time}
      </p>
    </div>
  );
}

/** Antes / ahora: el vuelo que se pierde contra la opción ofrecida. */
export function Compare({ before, after }: { before: FlightSlot; after: FlightSlot }) {
  return (
    <div className="mt-3 flex items-stretch gap-2" data-testid="compare" aria-label="Comparación antes y ahora">
      <Slot label={TEXT.before} slot={before} />
      <ArrowIcon className="size-5 shrink-0 self-center text-stone-400" />
      <Slot label={TEXT.after} slot={after} emphasis />
    </div>
  );
}
