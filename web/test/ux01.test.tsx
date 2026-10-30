// brain/features/UX-01_pantalla-moderna.feature — escenarios de interacción (jsdom).
// Los marcados @visual se ejecutan con Playwright en e2e/.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import type { Api, Assessment, RebookingResponse } from '../src/types';
import abc from './fixtures/assessment_ABC123.json';
import conf from './fixtures/assessment_DEMOCONF.json';
import noev from './fixtures/assessment_DEMONOEV.json';

const FIXTURES = { ABC123: abc, DEMOCONF: conf, DEMONOEV: noev } as unknown as Record<string, Assessment>;
const BASE_ALERT = 'Tu vuelo LA500 sale ahora a las 17:10.';
const UNVERIFIED = 'No pudimos confirmar el estado de tu viaje.';

function makeApi(over: Partial<Api> = {}): Api {
  return {
    scenarios: vi.fn(async () =>
      Object.keys(FIXTURES).map((id) => ({ booking_id: id, description: `Reserva ${id}`, simulated_clock: '2026-09-15T11:02:40Z' })),
    ),
    assessment: vi.fn(async (id: string) => structuredClone(FIXTURES[id]!)),
    requestRebooking: vi.fn(async (): Promise<RebookingResponse> => ({ kind: 'created', request_id: 'RBK-88231', expires_at: '2026-09-15T11:12:00Z' })),
    ...over,
  };
}

const open = (search = '') => {
  window.history.replaceState(null, '', `/${search}`);
};
const accept = () => screen.getByRole('button', { name: 'Aceptar este cambio' }) as HTMLButtonElement;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});

describe('Característica: Pantalla moderna del pasajero (UX-01)', () => {
  it('Escenario: El modo demo está separado de la vista del pasajero', async () => {
    render(<App api={makeApi()} />);
    await screen.findByText(BASE_ALERT);
    const bar = screen.getByTestId('demo-bar');
    expect(bar.textContent).toContain('Modo demo');
    expect(within(bar).getByRole('combobox', { name: 'Reserva de demostración' })).toBeTruthy();
    expect(within(bar).getByTestId('demo-clock').textContent).toBe('Reloj simulado: 2026-09-15 11:02:40 UTC');
    expect(within(screen.getByTestId('passenger-view')).queryByRole('combobox')).toBeNull();
  });

  it('Escenario: Un enlace directo abre la reserva indicada', async () => {
    open('?booking=DEMOCONF');
    render(<App api={makeApi()} />);
    await screen.findByText(UNVERIFIED);
    expect(within(screen.getByTestId('passenger-view')).getByText('Reserva DEMOCONF')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ABC123' } });
    await screen.findByText(BASE_ALERT);
    expect(window.location.search).toBe('?booking=ABC123');
  });

  it('Escenario: Un enlace con una reserva desconocida no rompe la pantalla', async () => {
    open('?booking=NOEXISTE');
    render(<App api={makeApi()} />);
    await screen.findByText(BASE_ALERT);
    expect(within(screen.getByTestId('passenger-view')).getByText('Reserva ABC123')).toBeTruthy();
  });

  it('Escenario: La tarjeta principal resume el estado con ícono y texto', async () => {
    render(<App api={makeApi()} />);
    await screen.findByText(BASE_ALERT);
    const hero = screen.getByTestId('status-hero');
    expect(hero.textContent).toContain(BASE_ALERT);
    expect(within(hero).getByRole('heading', { name: 'Tu viaje cambió' })).toBeTruthy();
    expect(hero.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('Escenario: La línea de tiempo muestra el itinerario y marca la conexión perdida', async () => {
    render(<App api={makeApi()} />);
    await screen.findByText(BASE_ALERT);
    const s1 = screen.getByTestId('leg-LA500');
    for (const t of ['SCL', 'LIM', '14:30', '17:10', '+160 min', 'Puerta 24', 'Retrasado']) expect(s1.textContent, t).toContain(t);
    const s2 = screen.getByTestId('leg-LA2410');
    for (const t of ['LIM', 'MEX', '19:05']) expect(s2.textContent, t).toContain(t);
    expect(within(s1).getByTestId('missed').textContent).toBe('Conexión perdida');
    expect(within(s2).queryByTestId('missed')).toBeNull();
  });

  it('Escenario: Un tramo sin confirmar muestra sólo lo programado', async () => {
    open('?booking=DEMOCONF');
    render(<App api={makeApi()} />);
    await screen.findByText(UNVERIFIED);
    const s1 = screen.getByTestId('leg-LA500');
    expect(s1.textContent).toContain('Sin confirmar');
    expect(s1.textContent).toContain('14:30');
    expect(within(s1).queryByTestId('new-departure')).toBeNull();
    expect(s1.textContent).not.toMatch(/\+\d+ min|17:10/);
    expect(screen.queryByTestId('missed')).toBeNull();
  });

  it('Escenario: La comparación antes / ahora muestra qué cambia', async () => {
    render(<App api={makeApi()} />);
    await screen.findByText(BASE_ALERT);
    const cmp = screen.getByTestId('compare').textContent ?? '';
    expect(cmp).toMatch(/Antes.*LA2410.*2026-09-15.*19:05/);
    expect(cmp).toMatch(/Ahora.*LA2412.*2026-09-16.*08:15/);
  });

  it('Escenario: Sin opción no hay comparación', async () => {
    open('?booking=DEMONOEV');
    render(<App api={makeApi()} />);
    await screen.findByText(UNVERIFIED);
    expect(screen.queryByTestId('compare')).toBeNull();
  });

  it('Escenario: La confirmación es un diálogo modal accesible', async () => {
    const api = makeApi();
    render(<App api={api} />);
    await screen.findByText(BASE_ALERT);
    fireEvent.click(accept());

    const dialog = screen.getByRole('dialog', { name: 'Confirmar el cambio de vuelo' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const yes = within(dialog).getByRole('button', { name: 'Sí, solicitar el cambio' });
    const back = within(dialog).getByRole('button', { name: 'Volver' });
    expect(document.activeElement).toBe(yes);

    back.focus();
    fireEvent.keyDown(back, { key: 'Tab' });
    expect(document.activeElement).toBe(yes);
    fireEvent.keyDown(yes, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(back);

    fireEvent.keyDown(back, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(api.requestRebooking).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(accept());
  });

  it('Escenario: La barra de vigencia avisa antes de vencer', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    render(<App api={makeApi()} />);
    await screen.findByText(BASE_ALERT);
    const bar = screen.getByRole('progressbar', { name: 'Vigencia de la opción' });
    expect(bar.getAttribute('aria-valuenow')).toBe('115');
    expect(bar.getAttribute('aria-valuemax')).toBe('115');

    act(() => { vi.advanceTimersByTime(84_000); });
    expect(screen.queryByText('Quedan 30 segundos para aceptar esta opción')).toBeNull();
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(screen.getByText('Quedan 30 segundos para aceptar esta opción').getAttribute('aria-live')).toBe('polite');

    act(() => { vi.advanceTimersByTime(30_000); });
    expect(screen.getByText(/La opción venció/).getAttribute('aria-live')).toBe('polite');
    expect(accept().disabled).toBe(true);
  });

  it('Escenario: Mientras carga se muestra un esqueleto', async () => {
    render(<App api={makeApi({ assessment: () => new Promise<Assessment>(() => {}) })} />);
    const skeleton = await screen.findByTestId('skeleton');
    expect(skeleton.getAttribute('aria-busy')).toBe('true');
  });

  it.each(['ABC123', 'DEMOCONF', 'DEMONOEV'])('Escenario: La pantalla nueva tampoco muestra datos internos (%s)', async (id) => {
    open(`?booking=${id}`);
    render(<App api={makeApi()} />);
    await screen.findByTestId('status-hero');
    const text = screen.getByTestId('passenger-view').textContent ?? '';
    for (const f of ['POL-DELAY-2026-03', 'R3', 'R5', 'dec_', 'data_quality', 'confidence', 'O2', 'O3']) expect(text, f).not.toContain(f);
  });
});
