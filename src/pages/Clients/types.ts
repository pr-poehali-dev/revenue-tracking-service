export interface Contact {
  id?: number;
  full_name: string;
  position: string;
  phone: string;
  email: string;
}

export interface Client {
  id?: number;
  name: string;
  notes: string;
  status?: string;
  contacts: Contact[];
  contacts_count?: number;
  created_at?: string;
}
