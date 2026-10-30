// Parte pantalla de brain/features/EP-01_pantalla-pasajero.feature (HU-010 y la interacción de HU-007).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import type { Api, Assessment, RebookingResponse } from '../src/types';
import abc from './fixtures/assessment_ABC123.json';
import conf from './fixtures/assessment_DEMOCONF.json';
import noev from './fixtures/assessment_DEMONOEV.json';

const FIXTURES: Record<string, Assessment> = { ABC123: abc, DEMOCONF: conf, DEMONOEV: noev } as Record<string, Assessment>;
const CREATED: RebookingResponse = { kind: 'created', request_id: 'RBK-88231', expires_at: '2026-09-15T11:12:00Z' };

function makeApi(over: Partial<Api> = {}, data: Record<string, Assessment> = FIXTURES) {
  return {
    scenarios: vi.fn(async () =>
      Object.keys(data).map((id) => ({ booking_id: id, description: `Reserva ${id}`, simulated_clock: '2026-09-15T11:02:40Z' })),
    ),
    assessment: vi.fn(async (id: string) => structuredClone(data[id]!)),
    requestRebooking: vi.fn(async (): Promise<RebookingResponse> => CREATED),
    ...over,
  };
}

const select = (id: string) => fireEvent.change(screen.getByRole('combobox'), { target: { value: id } });
const acceptButton = () => screen.queryByRole('button', { name: 'Aceptar este cambio' }) as HTMLButtonElement | null;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});

describe('Característica: Pantalla del pasajero (HU-010)', () => {
  it('Escenario: Caso base ABC123, la pantalla muestra alerta, impacto, opción y botón en ese orden', async () => {
    render(<App api={makeApi()} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    const text = document.body.textContent ?? '';

    const order = ['Alerta', 'Impacto', 'Siguiente paso', 'Aviso'].map((h) => text.indexOf(h));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(text).toContain('no llegas a tu conexión LA2410 de las 19:05');
    expect(text).toContain('LA2412 del 2026-09-16 a las 08:15 para 2 pasajeros');
    expect(text).toContain('Un agente te contactará en 45 minutos');
    expect(text).toContain('Datos actualizados a las 10:48');
    expect(acceptButton()).not.toBeNull();
    expect(acceptButton()!.disabled).toBe(false);
    expect(screen.getByLabelText('Tiempo restante de la opción').textContent).toBe('01:55');
  });

  it('Escenario: DEMOCONF, sin estado confirmado la pantalla no afirma ningún retraso', async () => {
    render(<App api={makeApi()} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    select('DEMOCONF');
    await screen.findByText('No pudimos confirmar el estado de tu viaje.');
    const text = document.body.textContent ?? '';
    expect(acceptButton()).toBeNull();
    expect(text).toMatch(/agente te contactará/);
    expect(text).not.toMatch(/retraso|LA2412|sale ahora/i);
  });

  it('Escenario: DEMONOEV, sin eventos la pantalla nunca dice que no hay cambios', async () => {
    render(<App api={makeApi()} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    select('DEMONOEV');
    await screen.findByText('No pudimos confirmar el estado de tu viaje.');
    expect(document.body.textContent).not.toMatch(/sin cambios|no hay cambios/i);
    expect(acceptButton()).toBeNull();
  });

  it('Escenario: Una plantilla desconocida se muestra como texto genérico de contacto', async () => {
    const data = { ABC123: { ...FIXTURES.ABC123!, message: { ...FIXTURES.ABC123!.message, template_id: 'PLANTILLA_FUTURA_V9' } } };
    render(<App api={makeApi({}, data)} />);
    await screen.findByText('No pudimos confirmar el estado de tu viaje.');
    expect(document.body.textContent).toContain('Contacta a un agente de LATAM');
    expect(acceptButton()).toBeNull();
  });

  it.each(['ABC123', 'DEMOCONF', 'DEMONOEV'])('Escenario: La pantalla no muestra datos internos (%s)', async (id) => {
    render(<App api={makeApi()} />);
    await screen.findByRole('combobox');
    select(id);
    await screen.findByText('Alerta');
    const text = document.body.textContent ?? '';
    for (const forbidden of ['POL-DELAY-2026-03', 'R3', 'R5', 'dec_', 'data_quality', 'confidence', 'O2', 'O3', 'rule_id', 'policy_ref']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });

  it('el número de caso sólo aparece como referencia', async () => {
    render(<App api={makeApi()} />);
    await screen.findByText('N.º de referencia: HC-4471');
    const hits = (document.body.textContent ?? '').match(/HC-4471/g) ?? [];
    expect(hits).toHaveLength(1);
  });

  it('un error de carga muestra un mensaje genérico y permite reintentar', async () => {
    const api = makeApi();
    (api.assessment as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('HTTP 500'));
    render(<App api={api} />);
    await screen.findByText('No pudimos cargar el estado de tu viaje. Intenta de nuevo.');
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    expect(api.assessment).toHaveBeenCalledTimes(2);
  });

  it('Actualizar vuelve a pedir la evaluación y reinicia la cuenta regresiva', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const api = makeApi();
    render(<App api={api} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(screen.getByLabelText('Tiempo restante de la opción').textContent).toBe('01:25');
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    await screen.findByLabelText('Tiempo restante de la opción');
    expect(api.assessment).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText('Tiempo restante de la opción').textContent).toBe('01:55');
  });
});

describe('Característica: Aceptar la opción (HU-007, pantalla)', () => {
  it('Escenario: Aceptar pide confirmación y sin confirmar no se llama al backend', async () => {
    const api = makeApi();
    render(<App api={api} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    fireEvent.click(acceptButton()!);
    expect(screen.getByText('¿Confirmas el cambio al vuelo LA2412 del 2026-09-16 a las 08:15 para 2 pasajeros?')).toBeTruthy();
    expect(api.requestRebooking).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(api.requestRebooking).not.toHaveBeenCalled();
    expect(acceptButton()).not.toBeNull();
  });

  it('Escenario: Confirmar crea una solicitud pendiente, nunca confirmada', async () => {
    const api = makeApi();
    render(<App api={api} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    fireEvent.click(acceptButton()!);
    fireEvent.click(screen.getByRole('button', { name: 'Sí, solicitar el cambio' }));

    await screen.findByText('Solicitud enviada: pendiente de confirmación hasta las 11:12 UTC.');
    expect(api.requestRebooking).toHaveBeenCalledTimes(1);
    expect(api.requestRebooking).toHaveBeenCalledWith('ABC123', { decision_id: 'dec_01JB7Q3M8K2V', option_id: 'O1' });
    expect(screen.getByText('N.º de la solicitud: RBK-88231')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/confirmado|confirmada/i);
    expect(acceptButton()).toBeNull(); // no se puede volver a enviar
  });

  it('Escenario: Aceptar dos veces crea una sola solicitud (la segunda respuesta es un duplicado y se trata como éxito)', async () => {
    const api = makeApi({ requestRebooking: vi.fn(async (): Promise<RebookingResponse> => ({ ...CREATED, kind: 'duplicate' })) });
    render(<App api={api} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    fireEvent.click(acceptButton()!);
    fireEvent.click(screen.getByRole('button', { name: 'Sí, solicitar el cambio' }));
    await screen.findByText('N.º de la solicitud: RBK-88231');
    expect(screen.getByText(/pendiente de confirmación/)).toBeTruthy();
  });

  it('Escenario: La opción vence mientras la pantalla está abierta', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const api = makeApi();
    render(<App api={api} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    act(() => { vi.advanceTimersByTime(114_000); });
    expect(acceptButton()!.disabled).toBe(false);
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(acceptButton()!.disabled).toBe(true);
    expect(screen.getByText('La opción venció. Actualiza para ver las opciones vigentes.')).toBeTruthy();
    fireEvent.click(acceptButton()!);
    expect(api.requestRebooking).not.toHaveBeenCalled();
  });

  it('si venció mientras se confirmaba, no se envía', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const api = makeApi();
    render(<App api={api} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    fireEvent.click(acceptButton()!);
    act(() => { vi.advanceTimersByTime(115_000); });
    expect(screen.queryByRole('button', { name: 'Sí, solicitar el cambio' })).toBeNull();
    expect(api.requestRebooking).not.toHaveBeenCalled();
  });

  it('el backend rechaza por vencida (410) o no recomendada (422): mensaje y sin éxito', async () => {
    for (const [code, text] of [
      ['OPTION_EXPIRED', 'La opción venció. Actualiza para ver las opciones vigentes.'],
      ['OPTION_NOT_RECOMMENDED', 'Esta opción ya no está disponible. Actualiza para ver las opciones vigentes.'],
    ] as const) {
      const api = makeApi({ requestRebooking: vi.fn(async (): Promise<RebookingResponse> => ({ kind: 'rejected', code })) });
      render(<App api={api} />);
      await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
      fireEvent.click(acceptButton()!);
      fireEvent.click(screen.getByRole('button', { name: 'Sí, solicitar el cambio' }));
      await screen.findByText(text);
      expect(document.body.textContent).not.toContain('Solicitud enviada');
      cleanup();
    }
  });

  it('indeterminado (202): "estamos confirmando", sin afirmar éxito', async () => {
    const api = makeApi({ requestRebooking: vi.fn(async (): Promise<RebookingResponse> => ({ kind: 'confirming' })) });
    render(<App api={api} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    fireEvent.click(acceptButton()!);
    fireEvent.click(screen.getByRole('button', { name: 'Sí, solicitar el cambio' }));
    await screen.findByText('Estamos confirmando tu solicitud.');
    expect(document.body.textContent).not.toContain('Solicitud enviada');
  });

  it('si la llamada falla por red, muestra un error y no un éxito', async () => {
    const api = makeApi({ requestRebooking: vi.fn(async () => { throw new Error('network'); }) });
    render(<App api={api} />);
    await screen.findByText('Tu vuelo LA500 sale ahora a las 17:10.');
    fireEvent.click(acceptButton()!);
    fireEvent.click(screen.getByRole('button', { name: 'Sí, solicitar el cambio' }));
    await screen.findByText('No pudimos enviar tu solicitud. Intenta de nuevo.');
  });
});
