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
import Clients from './Clients';

type NavItem = 'dashboard' | 'projects' | 'clients' | 'payments' | 'reports' | 'orders';

const Index = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<NavItem>('dashboard');
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const stats = [
    { title: 'Общая выручка', value: '12 450 000 ₽', change: '+12.5%', icon: 'TrendingUp', trend: 'up' },
    { title: 'Активные проекты', value: '24', change: '+3', icon: 'Briefcase', trend: 'up' },
    { title: 'Клиентов', value: '18', change: '+2', icon: 'Users', trend: 'up' },
    { title: 'Средний чек', value: '518 750 ₽', change: '+8.3%', icon: 'DollarSign', trend: 'up' },
  ];

  const revenueByMonth = [
    { month: 'Январь', revenue: 850000 },
    { month: 'Февраль', revenue: 920000 },
    { month: 'Март', revenue: 1100000 },
    { month: 'Апрель', revenue: 1050000 },
    { month: 'Май', revenue: 1200000 },
    { month: 'Июнь', revenue: 1450000 },
  ];

  const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue));

  const projects = [
    { id: 1, name: 'CRM Система', client: 'ООО "ТехноЛайн"', status: 'active', revenue: 2400000, progress: 75 },
    { id: 2, name: 'Мобильное приложение', client: 'ИП Иванов', status: 'active', revenue: 1800000, progress: 45 },
    { id: 3, name: 'Интернет-магазин', client: 'ООО "РосТорг"', status: 'active', revenue: 3200000, progress: 90 },
    { id: 4, name: 'Корп. портал', client: 'АО "ПромСтрой"', status: 'completed', revenue: 1500000, progress: 100 },
  ];

  const recentPayments = [
    { id: 1, client: 'ООО "ТехноЛайн"', amount: 400000, date: '2025-12-05', project: 'CRM Система' },
    { id: 2, client: 'ООО "РосТорг"', amount: 600000, date: '2025-12-03', project: 'Интернет-магазин' },
    { id: 3, client: 'ИП Иванов', amount: 300000, date: '2025-12-01', project: 'Мобильное приложение' },
  ];

  const navItems = [
    { id: 'dashboard' as NavItem, label: 'Дашборд', icon: 'LayoutDashboard' },
    { id: 'projects' as NavItem, label: 'Проекты', icon: 'Briefcase' },
    { id: 'clients' as NavItem, label: 'Клиенты', icon: 'Users' },
    { id: 'payments' as NavItem, label: 'Платежи', icon: 'CreditCard' },
    { id: 'reports' as NavItem, label: 'Отчёты', icon: 'FileText' },
    { id: 'orders' as NavItem, label: 'Заказы', icon: 'ShoppingCart' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-foreground flex items-center gap-2">
            <Icon name="BarChart3" size={28} className="text-sidebar-primary" />
            Revenue Track
          </h1>
          <p className="text-sm text-sidebar-foreground/60 mt-1">Управление выручкой</p>
        </div>
        
        <nav className="p-4 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${
                activeSection === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200"
          >
            <Icon name="LogOut" size={20} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 p-8">
        {activeSection === 'clients' ? (
          <Clients />
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Дашборд</h2>
              <p className="text-muted-foreground">Обзор ключевых показателей компании</p>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Icon name="ArrowUp" size={14} />
                  {stat.change} за месяц
                </p>
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
              <div className="space-y-4">
                {revenueByMonth.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">{item.month}</span>
                      <span className="font-semibold">{item.revenue.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Briefcase" size={20} />
                Активные проекты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.slice(0, 4).map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.client}</p>
                      </div>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status === 'active' ? 'Активен' : 'Завершён'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Прогресс: {project.progress}%</span>
                      <span className="font-semibold">{project.revenue.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Проект</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.client}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.project}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {payment.amount.toLocaleString('ru-RU')} ₽
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;