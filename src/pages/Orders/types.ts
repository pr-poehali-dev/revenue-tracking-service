export interface Order {
  id?: number;
  name: string;
  description: string;
  amount: number;
  order_status: string;
  status?: string;
  payment_status: string;
  payment_type: string;
  planned_date?: string;
  actual_date?: string;
  project_id?: number;
  project_name?: string;
  client_name?: string;
  created_at?: string;
  updated_at?: string;
}

export const ORDER_STATUSES = {
  new: 'Новый',
  in_progress: 'В работе',
  completed: 'Работы выполнены',
  done: 'Завершён'
} as const;

export const PAYMENT_STATUSES = {
  not_paid: 'Не оплачен',
  awaiting_payment: 'Ожидает оплаты',
  partially_paid: 'Оплачен частично',
  paid: 'Оплачен'
} as const;

export const PAYMENT_TYPES = {
  prepaid: 'Предоплата',
  postpaid: 'Постоплата',
  installments: 'Частями'
} as const;
