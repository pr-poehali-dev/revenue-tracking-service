import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import EmployeeCard from '@/components/employees/EmployeeCard';
import AddEmployeeDialog from '@/components/employees/AddEmployeeDialog';
import EditEmployeeDialog from '@/components/employees/EditEmployeeDialog';
import {
  Employee,
  API_URL,
  INVITE_API_URL,
  getRoleBadge,
  canManageEmployees,
  canEditEmployee,
  getAvailableRoles
} from '@/components/employees/employeeUtils';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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

  const handleAddEmployee = async (email: string, role: string) => {
    if (!email) {
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
          email,
          role
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Сотрудник добавлен'
        });
        setAddDialogOpen(false);
        loadEmployees();
      } else if (response.status === 404 && data.action === 'send_invitation') {
        const inviteResponse = await fetch(INVITE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId || '',
            'X-Company-Id': companyId || ''
          },
          body: JSON.stringify({
            email,
            role
          })
        });

        const inviteData = await inviteResponse.json();

        if (inviteResponse.ok) {
          toast({
            title: 'Приглашение отправлено!',
            description: `На ${email} отправлено письмо с приглашением`
          });
          setAddDialogOpen(false);
        } else {
          toast({
            title: 'Ошибка',
            description: inviteData.error || 'Не удалось отправить приглашение',
            variant: 'destructive'
          });
        }
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

  const handleEditEmployee = async (role: string) => {
    if (!selectedEmployee || !role) return;

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
          role
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

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditDialogOpen(true);
  };

  const canManage = canManageEmployees(currentUserRole);
  const availableRoles = getAvailableRoles(currentUserRole);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Сотрудники</h2>
            <p className="text-muted-foreground mt-1">Управление сотрудниками компании</p>
          </div>
          {canManage && (
            <Button onClick={() => setAddDialogOpen(true)}>
              <Icon name="UserPlus" className="mr-2" size={16} />
              Добавить сотрудника
            </Button>
          )}
        </div>

        {loading && employees.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Icon name="Loader2" className="animate-spin" size={32} />
            </CardContent>
          </Card>
        ) : employees.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Icon name="Users" className="text-muted-foreground mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2">Нет сотрудников</h3>
              <p className="text-muted-foreground text-center">
                Добавьте первого сотрудника в компанию
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {employees.map(employee => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                canEdit={canEditEmployee(currentUserRole, employee)}
                onEdit={handleEditClick}
                onDelete={handleDeleteEmployee}
                getRoleBadge={getRoleBadge}
              />
            ))}
          </div>
        )}
      </div>

      <AddEmployeeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        loading={loading}
        onAdd={handleAddEmployee}
        availableRoles={availableRoles}
      />

      <EditEmployeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        loading={loading}
        employee={selectedEmployee}
        onEdit={handleEditEmployee}
        availableRoles={availableRoles}
      />
    </DashboardLayout>
  );
}
