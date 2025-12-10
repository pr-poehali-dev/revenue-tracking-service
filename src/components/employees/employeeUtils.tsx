import { Badge } from '@/components/ui/badge';

export interface Employee {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  joined_at?: string;
  status?: 'active' | 'invited';
  invited_at?: string;
  expires_at?: string;
}

export const API_URL = 'https://functions.poehali.dev/4fce1ec8-13c8-41e1-bfb0-9ae58fc3789a';
export const INVITE_API_URL = 'https://functions.poehali.dev/56672d04-fb2e-4c4b-938b-31555bb4ff5e';

export const getRoleBadge = (role: string) => {
  const roles: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'outline' } } = {
    owner: { label: 'Владелец', variant: 'default' },
    admin: { label: 'Администратор', variant: 'secondary' },
    user: { label: 'Базовый', variant: 'outline' },
    viewer: { label: 'Наблюдатель', variant: 'outline' }
  };
  const roleInfo = roles[role] || { label: role, variant: 'outline' };
  return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
};

export const canManageEmployees = (currentUserRole: string) => {
  return currentUserRole === 'owner' || currentUserRole === 'admin';
};

export const canEditEmployee = (currentUserRole: string, employee: Employee) => {
  if (employee.status === 'invited') return false;
  if (currentUserRole === 'owner') return employee.role !== 'owner';
  if (currentUserRole === 'admin') return employee.role === 'user' || employee.role === 'viewer';
  return false;
};

export const getAvailableRoles = (currentUserRole: string) => {
  if (currentUserRole === 'owner') {
    return [
      { value: 'admin', label: 'Администратор' },
      { value: 'user', label: 'Базовый' },
      { value: 'viewer', label: 'Наблюдатель' }
    ];
  }
  return [
    { value: 'user', label: 'Базовый' },
    { value: 'viewer', label: 'Наблюдатель' }
  ];
};