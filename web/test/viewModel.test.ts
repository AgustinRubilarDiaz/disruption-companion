import { describe, expect, it } from 'vitest';
import { formatCountdown, toViewModel } from '../src/viewModel';
import type { Assessment } from '../src/types';
import abc from './fixtures/assessment_ABC123.json';
import conf from './fixtures/assessment_DEMOCONF.json';
import noev from './fixtures/assessment_DEMONOEV.json';

const A = abc as Assessment;

describe('toViewModel', () => {
  it('caso base: alerta, impacto, opción, aviso y hora de los datos, sólo con lo que trae el contrato', () => {
    const vm = toViewModel(A);
    expect(vm.kind).toBe('REBOOK_OFFER');
    expect(vm.alert).toBe('Tu vuelo LA500 sale ahora a las 17:10.');
    expect(vm.impact).toBe('Con este retraso no llegas a tu conexión LA2410 de las 19:05.');
    expect(vm.next).toBe('Te ofrecemos el vuelo LA2412 del 2026-09-16 a las 08:15 para 2 pasajeros, sin costo adicional.');
    expect(vm.notice).toBe('Un agente te contactará en 45 minutos para la atención prioritaria de tu grupo.');
    expect(vm.dataAsOf).toBe('Datos actualizados a las 10:48 UTC');
    expect(vm.reference).toBe('N.º de referencia: HC-4471');
    expect(vm.canAccept).toBe(true);
    expect(vm.option).toMatchObject({ optionId: 'O1', validForSeconds: 115 });
  });

  it('DEMOCONF y DEMONOEV: "no pudimos confirmar", sin botón, sin afirmar retrasos ni "sin cambios"', () => {
    for (const a of [conf, noev] as Assessment[]) {
      const vm = toViewModel(a);
      const text = [vm.alert, vm.impact, vm.next, vm.notice].join(' ');
      expect(vm.kind).toBe('UNVERIFIED');
      expect(vm.alert).toBe('No pudimos confirmar el estado de tu viaje.');
      expect(vm.canAccept).toBe(false);
      expect(vm.option).toBeUndefined();
      expect(text).toMatch(/agente te contactará/);
      expect(text).not.toMatch(/retraso|sin cambios|no hay cambios|LA2412/i);
    }
  });

  it('una plantilla desconocida da el texto genérico y nunca habilita el botón, aunque el siguiente paso sea ACCEPT_OPTION', () => {
    const a: Assessment = { ...A, message: { ...A.message, template_id: 'PLANTILLA_FUTURA_V9' } };
    const vm = toViewModel(a);
    expect(vm.kind).toBe('UNKNOWN');
    expect(vm.alert).toBe('No pudimos confirmar el estado de tu viaje.');
    expect(vm.canAccept).toBe(false);
  });

  it('no deriva nada por su cuenta: el impacto sale de la plantilla, no de impact.missed_connection', () => {
    const a: Assessment = { ...A, impact: { missed_connection: false } };
    expect(toViewModel(a).impact).toContain('no llegas a tu conexión');
  });

  it('sin una derivación creada no muestra número de caso', () => {
    const a: Assessment = { ...A, escalations: A.escalations.map((e) => ({ ...e, status: 'CREATION_FAILED', case_id: undefined })) };
    expect(toViewModel(a).reference).toBeUndefined();
  });

  it('itinerario del caso base: tramos con horas, retraso, puerta y la conexión perdida tras S1', () => {
    const { legs, missedAfter } = toViewModel(A).itinerary;
    expect(legs.map((l) => l.flight)).toEqual(['LA500', 'LA2410']);
    expect(legs[0]).toMatchObject({ status: 'DELAYED', scheduledDeparture: '14:30', newDeparture: '17:10', delayLabel: '+160 min', gate: '24' });
    expect(legs[1]).toMatchObject({ status: 'SCHEDULED', scheduledDeparture: '19:05' });
    expect(legs[1]!.newDeparture).toBeUndefined();
    expect(missedAfter).toBe('S1');
    expect(toViewModel(A).compare).toEqual({
      before: { flight: 'LA2410', date: '2026-09-15', time: '19:05' },
      after: { flight: 'LA2412', date: '2026-09-16', time: '08:15' },
    });
  });

  it('un tramo sin confirmar no expone hora nueva, retraso ni puerta aunque vinieran en el contrato', () => {
    const tampered: Assessment = {
      ...(conf as Assessment),
      segments: (conf as Assessment).segments.map((s) =>
        s.segment_id === 'S1' ? { ...s, new_departure_local: '17:10', delay_minutes: 160, gate: '24' } : s,
      ),
    };
    const s1 = toViewModel(tampered).itinerary.legs[0]!;
    expect(s1).toMatchObject({ status: 'UNVERIFIED', statusLabel: 'Sin confirmar', scheduledDeparture: '14:30' });
    expect(s1.newDeparture ?? s1.delayLabel ?? s1.gate).toBeUndefined();
    expect(toViewModel(tampered).itinerary.missedAfter).toBeUndefined();
  });

  it('sin opción ofrecida no hay comparación; un estado de tramo desconocido se muestra como sin confirmar', () => {
    expect(toViewModel(noev as Assessment).compare).toBeUndefined();
    const odd: Assessment = { ...A, segments: A.segments.map((s) => ({ ...s, status: 'BOARDING_V2' })) };
    expect(toViewModel(odd).itinerary.legs.every((l) => l.status === 'UNVERIFIED')).toBe(true);
  });

  it('formatea la cuenta regresiva', () => {
    expect(formatCountdown(115)).toBe('01:55');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(-3)).toBe('00:00');
  });
});
