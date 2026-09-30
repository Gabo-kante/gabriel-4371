export type SnailPayStatus = "approved" | "rejected" | "error";

export type SnailPayStatusDetail =
  // éxito
  | "accredited"
  // datos mal formados
  | "invalid_request"
  | "invalid_card_number"
  | "invalid_expiration_date"
  | "invalid_security_code"
  | "invalid_cardholder_name"
  | "invalid_amount"
  | "invalid_payer"
  // datos bien formados pero rechazados
  | "bad_expiration_date"
  | "bad_security_code"
  | "expired_card"
  | "insufficient_funds"
  | "card_declined"
  // errores del sistema
  | "too_many_requests"
  | "service_unavailable"
  | "internal_error";

export interface SnailPayResponse {
  id: string;
  status: SnailPayStatus;
  status_detail: SnailPayStatusDetail;
  transaction_amount: number | null;
  date_created: string;
  authorization_code: string | null;
  reference: string;
  payer_id: string | null;
  payer_email: string | null;
  card_number: string | null;
  cvv: string | null;
}