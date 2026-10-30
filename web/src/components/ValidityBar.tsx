import { TEXT } from '../copy';
import { formatCountdown } from '../viewModel';
import { ClockIcon } from './icons';

/** Vigencia de la opción. El aviso de 30 s y el de vencimiento van por aria-live. */
export function ValidityBar({ total, left }: { total: number; left: number }) {
  const pct = total > 0 ? Math.round((left / total) * 100) : 0;
  const expired = left <= 0;
  const urgent = !expired && left <= 30;
  const announcement = expired ? TEXT.expired : urgent ? TEXT.warn30 : '';

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-300">
          <ClockIcon className="size-4" /> {TEXT.validity}
        </span>
        {!expired && (
          <span
            aria-label="Tiempo restante de la opción"
            className={`font-semibold tabular-nums ${urgent ? 'text-warn-700 dark:text-warn-500' : 'text-brand-600 dark:text-brand-100'}`}
          >
            {formatCountdown(left)}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={TEXT.validity}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={left}
        aria-valuetext={`${left} de ${total} segundos`}
        className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${urgent ? 'bg-warn-500' : 'bg-brand-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p aria-live="polite" role="status" className={`mt-2 min-h-5 text-sm ${expired ? 'text-warn-700 dark:text-warn-500' : 'text-stone-600 dark:text-stone-300'}`}>
        {announcement}
      </p>
    </div>
  );
}
