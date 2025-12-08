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

const Dashboard = () => {
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
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${CLIENTS_API_URL}?status=active`, {
        headers: { 'X-User-Id': userId, 'X-Company-Id': companyId || '' }
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
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${PROJECTS_API_URL}?status=active`, {
        headers: { 'X-User-Id': userId, 'X-Company-Id': companyId || '' }
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
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${ORDERS_API_URL}?status=active`, {
        headers: { 'X-User-Id': userId, 'X-Company-Id': companyId || '' }
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
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${PAYMENTS_API_URL}?status=active`, {
        headers: { 'X-User-Id': userId, 'X-Company-Id': companyId || '' }
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
    const monthlyData: { [key: string]: { actual: number; planned: number } } = {};

    payments.forEach(payment => {
      const plannedAmount = payment.planned_amount_percent && payment.order_amount 
        ? (payment.order_amount * payment.planned_amount_percent) / 100 
        : (payment.planned_amount || 0);

      if (payment.planned_date && plannedAmount > 0) {
        const plannedDate = new Date(payment.planned_date);
        const plannedKey = `${plannedDate.getFullYear()}-${String(plannedDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[plannedKey]) {
          monthlyData[plannedKey] = { actual: 0, planned: 0 };
        }
        monthlyData[plannedKey].planned += plannedAmount;
      }

      if (payment.actual_date && payment.actual_amount > 0) {
        const actualDate = new Date(payment.actual_date);
        const actualKey = `${actualDate.getFullYear()}-${String(actualDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[actualKey]) {
          monthlyData[actualKey] = { actual: 0, planned: 0 };
        }
        monthlyData[actualKey].actual += payment.actual_amount;
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
              Выручка по месяцам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueByMonth.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="TrendingUp" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Нет данных о выручке</p>
                </div>
              ) : (
                revenueByMonth.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.month}</span>
                      <div className="flex gap-4">
                        <span className="text-muted-foreground">
                          План: {formatAmount(item.planned)}
                        </span>
                        <span className="font-medium text-primary">
                          Факт: {formatAmount(item.actual)}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-8 bg-muted overflow-hidden rounded-0">
                      {item.planned > 0 && (
                        <div
                          className="absolute h-full bg-muted-foreground/30 rounded-full"
                          style={{ width: `${(item.planned / maxRevenue) * 100}%` }}
                        />
                      )}
                      {item.actual > 0 && (
                        <div
                          className="absolute h-full bg-primary rounded-full"
                          style={{ width: `${(item.actual / maxRevenue) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Wallet" size={20} />
              Последние платежи
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Wallet" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Нет платежей</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between pb-3 border-b last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-foreground text-sm">{payment.order_name || 'Заказ'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.actual_date).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatAmount(payment.actual_amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon name="ShoppingCart" size={20} />
            Активные заказы
          </CardTitle>
          <Button onClick={() => navigate('/orders')} variant="outline" size="sm">
            Смотреть все
            <Icon name="ArrowRight" size={16} className="ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="ShoppingCart" size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Нет активных заказов</p>
              <Button onClick={() => navigate('/orders')} variant="outline">
                <Icon name="Plus" size={16} className="mr-2" />
                Создать заказ
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заказ</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Проект</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((order) => (
                  <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate('/orders')}>
                    <TableCell className="font-medium">{order.name}</TableCell>
                    <TableCell>{order.client_name || '—'}</TableCell>
                    <TableCell>{order.project_name || '—'}</TableCell>
                    <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right font-medium">{formatAmount(order.amount)}</TableCell>
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

export default Dashboard;