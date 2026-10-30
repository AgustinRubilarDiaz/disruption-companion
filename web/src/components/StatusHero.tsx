import type { Tone } from '../copy';
import { AlertIcon, CheckIcon, InfoIcon, SearchIcon } from './icons';

const TONE: Record<Tone, { box: string; icon: string; Icon: typeof AlertIcon }> = {
  warning: { box: 'bg-warn-50 border-warn-500/30 dark:bg-warn-700/15', icon: 'text-warn-700 dark:text-warn-500', Icon: AlertIcon },
  neutral: { box: 'bg-neutral-50 border-stone-300 dark:bg-stone-800/60 dark:border-stone-600', icon: 'text-stone-600 dark:text-stone-300', Icon: SearchIcon },
  info: { box: 'bg-info-50 border-info-600/30 dark:bg-info-600/15', icon: 'text-info-600', Icon: InfoIcon },
  ok: { box: 'bg-ok-50 border-ok-600/30 dark:bg-ok-600/15', icon: 'text-ok-600', Icon: CheckIcon },
};

/** Tarjeta principal: título + ícono + alerta. El título lleva el sentido; el color sólo lo acompaña. */
export function StatusHero({ title, tone, alert }: { title: string; tone: Tone; alert: string }) {
  const t = TONE[tone];
  return (
    <section
      aria-labelledby="hero-title"
      data-testid="status-hero"
      data-tone={tone}
      className={`rounded-2xl border p-5 transition-colors ${t.box}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Alerta</p>
      <div className="mt-2 flex items-start gap-3">
        <t.Icon className={`size-7 shrink-0 ${t.icon}`} />
        <div>
          <h2 id="hero-title" className="text-lg font-semibold text-stone-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-base font-medium text-stone-800 dark:text-stone-100">{alert}</p>
        </div>
      </div>
    </section>
  );
}
