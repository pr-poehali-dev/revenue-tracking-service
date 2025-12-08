import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/4fce1ec8-13c8-41e1-bfb0-9ae58fc3789a';

interface Employee {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  joined_at?: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('user');
  const [editRole, setEditRole] = useState('');
  const { toast } = useToast();

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        setEmployees(data.employees);
        setCurrentUserRole(data.current_user_role);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить сотрудников',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleAddEmployee = async () => {
    if (!newEmployeeEmail) {
      toast({
        title: 'Ошибка',
        description: 'Введите email',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify({
          email: newEmployeeEmail,
          role: newEmployeeRole
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Сотрудник добавлен'
        });
        setAddDialogOpen(false);
        setNewEmployeeEmail('');
        setNewEmployeeRole('user');
        loadEmployees();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось добавить сотрудника',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee || !editRole) return;

    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify({
          employee_id: selectedEmployee.id,
          role: editRole
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Роль обновлена'
        });
        setEditDialogOpen(false);
        setSelectedEmployee(null);
        setEditRole('');
        loadEmployees();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить роль',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Удалить ${employee.first_name} ${employee.last_name} из компании?`)) return;

    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${API_URL}?employee_id=${employee.id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Сотрудник удален'
        });
        loadEmployees();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить сотрудника',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'outline' } } = {
      owner: { label: 'Владелец', variant: 'default' },
      admin: { label: 'Администратор', variant: 'secondary' },
      user: { label: 'Базовый', variant: 'outline' },
      viewer: { label: 'Наблюдатель', variant: 'outline' }
    };
    const roleInfo = roles[role] || { label: role, variant: 'outline' };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  const canManageEmployees = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canEditEmployee = (employee: Employee) => {
    if (currentUserRole === 'owner') return employee.role !== 'owner';
    if (currentUserRole === 'admin') return employee.role === 'user' || employee.role === 'viewer';
    return false;
  };

  const getAvailableRoles = () => {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Сотрудники</h2>
            <p className="text-muted-foreground mt-1">Управление сотрудниками компании</p>
          </div>
          {canManageEmployees && (
            <Button onClick={() => setAddDialogOpen(true)} disabled={loading}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить сотрудника
            </Button>
          )}
        </div>

        {loading && employees.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex justify-center">
              <Icon name="Loader2" className="animate-spin" size={48} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" size={20} />
                Список сотрудников ({employees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Нет сотрудников</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-background hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={employee.avatar_url || ''} />
                          <AvatarFallback>
                            {employee.first_name[0]}{employee.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {employee.last_name} {employee.first_name} {employee.middle_name || ''}
                            </p>
                            {getRoleBadge(employee.role)}
                          </div>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                          {employee.phone && (
                            <p className="text-sm text-muted-foreground">{employee.phone}</p>
                          )}
                        </div>
                      </div>
                      {canManageEmployees && canEditEmployee(employee) && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setEditRole(employee.role);
                              setEditDialogOpen(true);
                            }}
                            disabled={loading}
                          >
                            <Icon name="Edit" size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee)}
                            disabled={loading}
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить сотрудника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email сотрудника</Label>
              <Input
                type="email"
                value={newEmployeeEmail}
                onChange={(e) => setNewEmployeeEmail(e.target.value)}
                placeholder="employee@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Пользователь должен быть зарегистрирован в системе
              </p>
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={newEmployeeRole} onValueChange={setNewEmployeeRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setNewEmployeeEmail('');
                setNewEmployeeRole('user');
              }}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button onClick={handleAddEmployee} disabled={loading || !newEmployeeEmail}>
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Добавление...
                </>
              ) : (
                'Добавить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить роль сотрудника</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedEmployee.avatar_url || ''} />
                  <AvatarFallback>
                    {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedEmployee.last_name} {selectedEmployee.first_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Новая роль</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedEmployee(null);
                setEditRole('');
              }}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button onClick={handleEditEmployee} disabled={loading || !editRole}>
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}