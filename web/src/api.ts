import type { Api, Assessment, RebookingResponse, ScenarioInfo } from './types';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const httpApi: Api = {
  async scenarios(): Promise<ScenarioInfo[]> {
    return (await json<{ scenarios: ScenarioInfo[] }>(await fetch(`${BASE}/v1/scenarios`))).scenarios;
  },

  async assessment(bookingId: string): Promise<Assessment> {
    return json<Assessment>(await fetch(`${BASE}/v1/bookings/${encodeURIComponent(bookingId)}/disruption-assessment`));
  },

  async requestRebooking(bookingId, body): Promise<RebookingResponse> {
    const res = await fetch(`${BASE}/v1/bookings/${encodeURIComponent(bookingId)}/rebooking-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, string>;
    if (res.status === 201 || res.status === 200) {
      return { kind: res.status === 201 ? 'created' : 'duplicate', request_id: data.request_id ?? '', expires_at: data.expires_at ?? '' };
    }
    if (res.status === 202) return { kind: 'confirming' };
    if (res.status === 410) return { kind: 'rejected', code: 'OPTION_EXPIRED' };
    if (res.status === 422) return { kind: 'rejected', code: 'OPTION_NOT_RECOMMENDED' };
    return { kind: 'rejected', code: 'OTHER' };
  },
};
