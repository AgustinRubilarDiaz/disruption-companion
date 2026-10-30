import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TEXT } from '../copy';

/** Diálogo modal: foco inicial en confirmar, Tab no sale del diálogo y Escape cancela sin enviar. */
export function ConfirmDialog({ text, onConfirm, onCancel }: { text: string; onConfirm: () => void; onCancel: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const confirm = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirm.current?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = panel.current?.querySelectorAll<HTMLElement>('button:not([disabled])');
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 p-0 sm:items-center sm:p-4" onClick={onCancel}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-text"
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl transition-transform motion-safe:animate-[sheet_200ms_ease-out] sm:rounded-3xl dark:bg-stone-900"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-stone-900 dark:text-white">{TEXT.dialogTitle}</h2>
        <p id="confirm-text" className="mt-2 text-stone-700 dark:text-stone-200">{text}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            ref={confirm}
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            {TEXT.confirmYes}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-300 px-4 py-3 font-medium text-stone-800 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-stone-600 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            {TEXT.confirmNo}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
