import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/layouts/DashboardLayout';

const CLIENTS_API_URL = 'https://functions.poehali.dev/c1ed6936-95c5-4b22-a918-72cc11832898';
const PROJECTS_API_URL = 'https://functions.poehali.dev/5741ba68-de8d-41af-bdef-39c18cc09090';
const ORDERS_API_URL = 'https://functions.poehali.dev/6ed190b1-80de-4d7b-8046-a6fc234c502c';
const PAYMENTS_API_URL = 'https://functions.poehali.dev/1296228e-b15c-463a-9267-4c510ee723b2';

const Index = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeProjects: 0,
    totalClients: 0,
    totalOrders: 0
  });
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; actual: number; planned: number }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    try {
      await Promise.all([
        loadClients(userId),
        loadProjects(userId),
        loadOrders(userId),
        loadPayments(userId)
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const loadClients = async (userId: string) => {
    try {
      const response = await fetch(`${CLIENTS_API_URL}?status=active`, {
        headers: { 'X-User-Id': userId }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(prev => ({ ...prev, totalClients: data.clients?.length || 0 }));
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const loadProjects = async (userId: string) => {
    try {
      const response = await fetch(`${PROJECTS_API_URL}?status=active`, {
        headers: { 'X-User-Id': userId }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(prev => ({ ...prev, activeProjects: data.projects?.length || 0 }));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadOrders = async (userId: string) => {
    try {
      const response = await fetch(`${ORDERS_API_URL}?status=active`, {
        headers: { 'X-User-Id': userId }
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
        setStats(prev => ({ ...prev, totalOrders: data.orders?.length || 0 }));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadPayments = async (userId: string) => {
    try {
      const response = await fetch(`${PAYMENTS_API_URL}?status=active`, {
        headers: { 'X-User-Id': userId }
      });
      const data = await response.json();
      if (response.ok) {
        const payments = data.payments || [];
        
        const paidPayments = payments.filter((p: any) => p.actual_date && p.actual_amount > 0);
        
        const totalRevenue = paidPayments.reduce((sum: number, p: any) => sum + (p.actual_amount || 0), 0);
        setStats(prev => ({ ...prev, totalRevenue }));
        
        const monthlyRevenue = calculateMonthlyRevenue(payments);
        setRevenueByMonth(monthlyRevenue);
        
        const sortedPayments = [...paidPayments]
          .sort((a, b) => new Date(b.actual_date).getTime() - new Date(a.actual_date).getTime())
          .slice(0, 5);
        setRecentPayments(sortedPayments);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  const calculateMonthlyRevenue = (payments: any[]) => {
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const monthlyData: { [key: string]: { actual: number; planned: number } } = {};

    for (let i = 0; i <= 5; i++) {
      const date = new Date(currentYear, currentDate.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { actual: 0, planned: 0 };
    }

    payments.forEach(payment => {
      if (payment.actual_date && payment.actual_amount > 0) {
        const date = new Date(payment.actual_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.hasOwnProperty(key)) {
          monthlyData[key].actual += payment.actual_amount;
        }
      }
      
      if (payment.planned_date && !payment.actual_date) {
        const plannedAmount = payment.planned_amount || 
          (payment.planned_amount_percent && payment.order_amount 
            ? (payment.order_amount * payment.planned_amount_percent) / 100 
            : 0);
        
        if (plannedAmount > 0) {
          const date = new Date(payment.planned_date);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyData.hasOwnProperty(key)) {
            monthlyData[key].planned += plannedAmount;
          }
        }
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        return {
          month: monthNames[parseInt(month) - 1],
          actual: data.actual,
          planned: data.planned
        };
      });
  };

  const maxRevenue = Math.max(...revenueByMonth.map(m => m.actual + m.planned), 1);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getOrderStatusBadge = (status: string) => {
    const statuses: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      new: { label: 'Новый', variant: 'default' },
      in_progress: { label: 'В работе', variant: 'secondary' },
      completed: { label: 'Работы выполнены', variant: 'outline' },
      done: { label: 'Завершён', variant: 'secondary' }
    };
    const statusInfo = statuses[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const statsCards = [
    { title: 'Общая выручка', value: formatAmount(stats.totalRevenue), icon: 'TrendingUp' },
    { title: 'Активные проекты', value: stats.activeProjects.toString(), icon: 'Briefcase' },
    { title: 'Клиентов', value: stats.totalClients.toString(), icon: 'Users' },
    { title: 'Заказов', value: stats.totalOrders.toString(), icon: 'ShoppingCart' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Дашборд</h2>
        <p className="text-muted-foreground">Обзор ключевых показателей компании</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name={stat.icon} size={20} className="text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="TrendingUp" size={20} />
              Динамика выручки
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByMonth.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет данных о платежах
              </div>
            ) : (
              <div className="space-y-4">
                {revenueByMonth.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">{item.month}</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold text-green-700">{formatAmount(item.actual)}</span>
                        {item.planned > 0 && (
                          <span className="text-xs text-muted-foreground">План: {formatAmount(item.planned)}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden relative">
                      <div
                        className="bg-green-600 h-full rounded-full transition-all duration-500 ease-out absolute"
                        style={{ width: `${(item.actual / maxRevenue) * 100}%` }}
                      />
                      <div
                        className="bg-blue-400/40 h-full rounded-full transition-all duration-500 ease-out absolute"
                        style={{ 
                          width: `${((item.actual + item.planned) / maxRevenue) * 100}%`,
                          left: 0
                        }}
                      />
                    </div>
                    {item.planned > 0 && (
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                          <span className="text-muted-foreground">Фактическая</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-blue-400/40"></div>
                          <span className="text-muted-foreground">Планируемая</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="ShoppingCart" size={20} />
              Активные заказы
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="ShoppingCart" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Активных заказов нет</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="space-y-2 pb-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{order.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.project_name}
                          {order.client_name && ` • ${order.client_name}`}
                        </p>
                      </div>
                      {getOrderStatusBadge(order.order_status)}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        {order.planned_date && `До ${new Date(order.planned_date).toLocaleDateString('ru-RU')}`}
                      </span>
                      <span className="font-semibold">{formatAmount(order.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="CreditCard" size={20} />
            Последние платежи
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="CreditCard" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Платежей пока нет</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заказ</TableHead>
                  <TableHead>Проект / Клиент</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.order_name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>
                        {payment.project_name && <div className="text-sm">{payment.project_name}</div>}
                        {payment.client_name && <div className="text-xs">{payment.client_name}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.actual_date ? new Date(payment.actual_date).toLocaleDateString('ru-RU') : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatAmount(payment.actual_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Index;