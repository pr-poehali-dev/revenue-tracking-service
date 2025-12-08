import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/layouts/DashboardLayout';
import OrdersTable from './Orders/OrdersTable';
import OrderDialog from './Orders/OrderDialog';
import { Order } from './Orders/types';

const API_URL = 'https://functions.poehali.dev/6ed190b1-80de-4d7b-8046-a6fc234c502c';
const PROJECTS_API_URL = 'https://functions.poehali.dev/5741ba68-de8d-41af-bdef-39c18cc09090';

interface Project {
  id: number;
  name: string;
  client_name?: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const { toast } = useToast();

  const [formData, setFormData] = useState<Order>({
    name: '',
    description: '',
    amount: 0,
    order_status: 'new',
    status: 'active',
    payment_status: 'not_paid',
    payment_type: 'postpaid',
    project_id: undefined,
    planned_date: undefined,
    actual_date: undefined
  });

  useEffect(() => {
    loadOrders();
    loadProjects();
  }, [viewMode]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const url = `${API_URL}?status=${viewMode}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить заказы',
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

  const loadProjects = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${PROJECTS_API_URL}?status=active`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        id: order.id,
        name: order.name,
        description: order.description || '',
        amount: order.amount || 0,
        order_status: order.order_status || 'new',
        status: order.status || 'active',
        payment_status: order.payment_status || 'not_paid',
        payment_type: order.payment_type || 'postpaid',
        project_id: order.project_id,
        planned_date: order.planned_date,
        actual_date: order.actual_date
      });
    } else {
      setEditingOrder(null);
      setFormData({
        name: '',
        description: '',
        amount: 0,
        order_status: 'new',
        status: 'active',
        payment_status: 'not_paid',
        payment_type: 'postpaid',
        project_id: undefined,
        planned_date: undefined,
        actual_date: undefined
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOrder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название заказа обязательно',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const method = editingOrder ? 'PUT' : 'POST';
      
      const response = await fetch(API_URL, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: editingOrder ? 'Заказ обновлён' : 'Заказ добавлен'
        });
        handleCloseDialog();
        loadOrders();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось сохранить заказ',
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

  const handleArchive = async (orderId: number) => {
    if (!confirm('Переместить заказ в архив?')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const order = orders.find(o => o.id === orderId);
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
        },
        body: JSON.stringify({
          id: orderId,
          name: order?.name || '',
          description: order?.description || '',
          amount: order?.amount || 0,
          order_status: order?.order_status || 'new',
          payment_status: order?.payment_status || 'not_paid',
          payment_type: order?.payment_type || 'postpaid',
          project_id: order?.project_id,
          planned_date: order?.planned_date,
          actual_date: order?.actual_date,
          status: 'archived'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Заказ перемещён в архив'
        });
        setViewMode('active');
        loadOrders();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось архивировать заказ',
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

  const handleActivate = async (orderId: number) => {
    if (!confirm('Вернуть заказ в активный статус?')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const order = orders.find(o => o.id === orderId);
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify({
          id: orderId,
          name: order?.name || '',
          description: order?.description || '',
          amount: order?.amount || 0,
          order_status: order?.order_status || 'new',
          payment_status: order?.payment_status || 'not_paid',
          payment_type: order?.payment_type || 'postpaid',
          project_id: order?.project_id,
          planned_date: order?.planned_date,
          actual_date: order?.actual_date,
          status: 'active'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Заказ возвращён в активные'
        });
        loadOrders();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось активировать заказ',
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

  const handleDelete = async (orderId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${API_URL}?id=${orderId}`, {
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
          description: 'Заказ удалён'
        });
        loadOrders();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить заказ',
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

  const handleViewDetails = async (orderId: number) => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}?id=${orderId}`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        handleOpenDialog(data);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить данные заказа',
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Заказы</h2>
            <p className="text-muted-foreground mt-1">Управление заказами компании</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'active' ? 'default' : 'outline'}
              onClick={() => setViewMode('active')}
              disabled={loading}
            >
              Активные
            </Button>
            <Button
              variant={viewMode === 'archived' ? 'default' : 'outline'}
              onClick={() => setViewMode('archived')}
              disabled={loading}
            >
              Архив
            </Button>
            {viewMode === 'active' && (
              <Button onClick={() => handleOpenDialog()} disabled={loading}>
                <Icon name="Plus" size={20} className="mr-2" />
                Добавить заказ
              </Button>
            )}
          </div>
        </div>

        <OrdersTable
          orders={orders}
          loading={loading}
          viewMode={viewMode}
          onViewDetails={handleViewDetails}
          onArchive={handleArchive}
          onActivate={handleActivate}
          onDelete={handleDelete}
        />

        <OrderDialog
          open={dialogOpen}
          editingOrder={editingOrder}
          formData={formData}
          loading={loading}
          projects={projects}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
        />
      </div>
    </DashboardLayout>
  );
}