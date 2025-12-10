export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

// export interface PaystackVerifyResponse {
//   status: boolean;
//   message: string;
//   data: {
//     reference: string;
//     amount: number;
//     status: 'success' | 'failed' | 'abandoned';
//     paid_at: string;
//     customer: {
//       email: string;
//     };
//   };
// }

export enum PaystackEvents {
  PAYMENT_SUCCESSFUL = 'charge.success',
  TRANSFER_SUCCESS = 'transfer.success',
  TRANSFER_FAILED = 'transfer.failed',
}

export type PaystackCurrency = 'NGN' | 'USD' | 'GHS' | 'ZAR' | 'KES';

export type PaystackTransactionStatus =
  | 'success'
  | 'failed'
  | 'abandoned'
  | 'pending';

export type PaystackChannels =
  | 'card'
  | 'bank'
  | 'ussd'
  | 'qr'
  | 'mobile_money'
  | 'bank_transfer';

export interface PaystackAuthorization {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: PaystackChannels;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
  account_name?: string | null;
}

export interface PaystackCustomer {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  customer_code: string;
  phone?: string | null;
  metadata?: any;
  risk_action: string;
  international_format_phone?: string | null;
}

export interface PaystackSource {
  type: string;
  source: string;
  entry_point: string;
  identifier?: string | null;
}

export interface PaystackWebhookData {
  id: number;
  domain: string;
  status: PaystackTransactionStatus;
  reference: string;
  amount: number;
  message?: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: PaystackChannels;
  currency: PaystackCurrency;
  ip_address: string;
  metadata?: any;
  fees_breakdown?: any;
  log?: any;
  fees?: number;
  fees_split?: any;
  authorization?: PaystackAuthorization;
  customer: PaystackCustomer;
  plan?: any;
  subaccount?: any;
  split?: any;
  order_id?: string | null;
  paidAt?: string;
  requested_amount?: number;
  pos_transaction_data?: any;
  source?: PaystackSource;
}

export interface PaystackWebhookPayload {
  event: PaystackEvents;
  data: PaystackWebhookData;
}

// Initialize transaction response
export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: PaystackWebhookData;
}