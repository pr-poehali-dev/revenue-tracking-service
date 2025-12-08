import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/layouts/DashboardLayout';
import PaymentsTable from './Payments/PaymentsTable';
import PaymentDialog from './Payments/PaymentDialog';
import { Payment } from './Payments/types';

const API_URL = 'https://functions.poehali.dev/1296228e-b15c-463a-9267-4c510ee723b2';
const ORDERS_API_URL = 'https://functions.poehali.dev/6ed190b1-80de-4d7b-8046-a6fc234c502c';

interface Order {
  id: number;
  name: string;
  amount: number;
  project_name?: string;
  client_name?: string;
}

export default function Payments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const { toast } = useToast();

  const [formData, setFormData] = useState<Payment>({
    planned_amount: undefined,
    planned_amount_percent: undefined,
    actual_amount: 0,
    planned_date: undefined,
    actual_date: undefined,
    order_id: undefined,
    status: 'active'
  });

  useEffect(() => {
    loadPayments();
    loadOrders();
  }, [viewMode]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      
      console.log('Loading payments with:', { userId, companyId });
      
      if (!userId || !companyId) {
        toast({
          title: 'Ошибка авторизации',
          description: 'Пожалуйста, войдите в систему заново',
          variant: 'destructive'
        });
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      
      const url = `${API_URL}?status=${viewMode}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-User-Id': userId,
          'X-Company-Id': companyId
        }
      });

      const data = await response.json();
      console.log('Response:', { status: response.status, data });

      if (response.ok) {
        setPayments(data.payments || []);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить платежи',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Load payments error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${ORDERS_API_URL}?status=active`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        id: payment.id,
        planned_amount: payment.planned_amount,
        planned_amount_percent: payment.planned_amount_percent,
        actual_amount: payment.actual_amount || 0,
        planned_date: payment.planned_date,
        actual_date: payment.actual_date,
        order_id: payment.order_id,
        status: payment.status || 'active'
      });
    } else {
      setEditingPayment(null);
      setFormData({
        planned_amount: undefined,
        planned_amount_percent: undefined,
        actual_amount: 0,
        planned_date: undefined,
        actual_date: undefined,
        order_id: undefined,
        status: 'active'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPayment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.order_id) {
      toast({
        title: 'Ошибка',
        description: 'Заказ обязателен',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const method = editingPayment ? 'PUT' : 'POST';
      
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
          description: editingPayment ? 'Платёж обновлён' : 'Платёж добавлен'
        });
        handleCloseDialog();
        loadPayments();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось сохранить платёж',
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

  const handleArchive = async (paymentId: number) => {
    if (!confirm('Переместить платёж в архив?')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const payment = payments.find(p => p.id === paymentId);
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify({
          id: paymentId,
          planned_amount: payment?.planned_amount,
          planned_amount_percent: payment?.planned_amount_percent,
          actual_amount: payment?.actual_amount || 0,
          planned_date: payment?.planned_date,
          actual_date: payment?.actual_date,
          order_id: payment?.order_id,
          status: 'archived'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Платёж перемещён в архив'
        });
        setViewMode('active');
        loadPayments();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось архивировать платёж',
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

  const handleActivate = async (paymentId: number) => {
    if (!confirm('Вернуть платёж в активные?')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const payment = payments.find(p => p.id === paymentId);
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify({
          id: paymentId,
          planned_amount: payment?.planned_amount,
          planned_amount_percent: payment?.planned_amount_percent,
          actual_amount: payment?.actual_amount || 0,
          planned_date: payment?.planned_date,
          actual_date: payment?.actual_date,
          order_id: payment?.order_id,
          status: 'active'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Платёж возвращён в активные'
        });
        loadPayments();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось активировать платёж',
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

  const handleDelete = async (paymentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот платёж? Это действие нельзя отменить.')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${API_URL}?id=${paymentId}`, {
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
          description: 'Платёж удалён'
        });
        loadPayments();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить платёж',
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

  const handleViewDetails = async (paymentId: number) => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}?id=${paymentId}`, {
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
          description: data.error || 'Не удалось загрузить данные платежа',
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
            <h2 className="text-3xl font-bold text-foreground">Платежи</h2>
            <p className="text-muted-foreground mt-1">Управление платежами компании</p>
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
                Добавить платёж
              </Button>
            )}
          </div>
        </div>

        <PaymentsTable
          payments={payments}
          loading={loading}
          viewMode={viewMode}
          onViewDetails={handleViewDetails}
          onArchive={handleArchive}
          onActivate={handleActivate}
          onDelete={handleDelete}
        />

        <PaymentDialog
          open={dialogOpen}
          editingPayment={editingPayment}
          formData={formData}
          loading={loading}
          orders={orders}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
        />
      </div>
    </DashboardLayout>
  );
}