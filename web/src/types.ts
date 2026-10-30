// Lo que la pantalla lee de DisruptionAssessment v1.0 (Docs/16). Los enums son `string` a propósito:
// ante un valor desconocido la pantalla muestra el estado genérico y no deduce nada (Docs/16 §16.4).

export interface Assessment {
  schema_version: string;
  decision_id: string;
  booking_id: string;
  evaluated_at: string;
  trip_status: string;
  segments: { segment_id: string; status: string; data_as_of?: string }[];
  impact?: {
    missed_connection: boolean;
    connection?: { estimated_arrival_local: string; next_departure_local: string };
  };
  recommended_option: null | {
    option_id: string;
    flight_number?: string;
    date?: string;
    departure_local?: string;
    valid_until: string;
  };
  next_step: string;
  escalations: { reason: string; status: string; case_id?: string; sla_minutes?: number }[];
  message: { template_id: string; params: Record<string, string | number> };
}

export interface ScenarioInfo {
  booking_id: string;
  description: string;
  simulated_clock: string;
}

export type RebookingResponse =
  | { kind: 'created' | 'duplicate'; request_id: string; expires_at: string }
  | { kind: 'confirming' }
  | { kind: 'rejected'; code: 'OPTION_EXPIRED' | 'OPTION_NOT_RECOMMENDED' | 'OTHER' };

export interface Api {
  scenarios(): Promise<ScenarioInfo[]>;
  assessment(bookingId: string): Promise<Assessment>;
  requestRebooking(bookingId: string, body: { decision_id: string; option_id: string }): Promise<RebookingResponse>;
}
