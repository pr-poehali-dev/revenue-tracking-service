export interface Payment {
  id?: number;
  planned_amount?: number;
  planned_amount_percent?: number;
  actual_amount: number;
  planned_date?: string;
  actual_date?: string;
  order_id?: number;
  order_name?: string;
  order_amount?: number;
  project_name?: string;
  client_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
