import { request } from '@umijs/max';

export interface VietQRBankInfo {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
}

export interface PaymentData {
  id: string;
  txn_ref: string;
  user_id: string;
  course_id: string;
  amount: number;
  payment_method: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  qr_code_url: string | null;
  bank_id: string;
  account_no: string;
  account_name: string;
  paid_at: string | null;
  expires_at: string | null;
  createdAt: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  is_free: boolean;
  is_reused?: boolean;
  message?: string;
  error?: string;
  data?: {
    payment?: PaymentData;
    qr_code_url?: string;
    bank_info?: VietQRBankInfo;
    txn_ref?: string;
    amount?: number;
    course_title?: string;
    expires_at?: string;
    expires_in_seconds?: number;
    enrollment?: any;
  };
}

export interface ConfirmPaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    payment: PaymentData;
    enrollment: any;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  error?: string;
  data?: {
    payment: PaymentData;
  };
}

export interface AdminPaymentsResponse {
  success: boolean;
  data: (PaymentData & {
    user?: { id: string; full_name: string; email: string; username: string };
    course?: { id: string; title: string; thumbnail: string | null; price: number; sale_price: number | null };
  })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total_revenue: number;
    total_transactions: number;
    success_count: number;
    pending_count: number;
    expired_count: number;
  };
}

export interface InstructorTransactionsResponse {
  success: boolean;
  data: (PaymentData & {
    user?: { id: string; full_name: string; email: string };
    course?: { id: string; title: string; thumbnail: string | null; price: number };
  })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    instructor_revenue: number;
    total_sales: number;
  };
}

// POST /api/payments/create
export async function createPayment(courseId: string, forceNew?: boolean) {
  return request<CreatePaymentResponse>('/api/payments/create', {
    method: 'POST',
    data: { course_id: courseId, force_new: forceNew },
  });
}

// POST /api/payments/confirm/:id
export async function confirmPayment(paymentId: string) {
  return request<ConfirmPaymentResponse>(`/api/payments/confirm/${paymentId}`, {
    method: 'POST',
  });
}

// GET /api/payments/status/:txnRef
export async function getPaymentStatus(txnRef: string) {
  return request<PaymentStatusResponse>(`/api/payments/status/${txnRef}`, {
    method: 'GET',
  });
}

// GET /api/payments/me
export async function getMyPayments() {
  return request<{ success: boolean; data: (PaymentData & { course?: { id: string; title: string; thumbnail: string | null } })[] }>('/api/payments/me', {
    method: 'GET',
  });
}

// GET /api/payments/admin/all
export async function getAllPaymentsAdmin(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  return request<AdminPaymentsResponse>('/api/payments/admin/all', {
    method: 'GET',
    params,
  });
}

// GET /api/payments/instructor/my-transactions
export async function getInstructorTransactions(params?: {
  page?: number;
  limit?: number;
}) {
  return request<InstructorTransactionsResponse>('/api/payments/instructor/my-transactions', {
    method: 'GET',
    params,
  });
}
