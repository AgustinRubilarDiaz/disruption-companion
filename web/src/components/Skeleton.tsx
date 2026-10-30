import { TEXT } from '../copy';

export function Skeleton() {
  return (
    <div aria-busy="true" aria-label={TEXT.loading} role="status" data-testid="skeleton" className="space-y-4">
      {[28, 40, 24].map((h, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" style={{ height: `${h * 4}px` }} />
      ))}
      <span className="sr-only">{TEXT.loading}</span>
    </div>
  );
}
