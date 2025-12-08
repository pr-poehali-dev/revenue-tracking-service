import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ReportCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
};

type Stats = {
  clients: { total: number; growth: number };
  projects: { total: number; growth: number };
  revenue: { total: number; growth: number };
  orders: { total: number; growth: number };
};

const STATS_API_URL = 'https://functions.poehali.dev/f127eb56-21d2-49b6-abe8-68a213f0ae86';

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
    } else {
      loadStats();
    }
  }, [navigate]);

  const loadStats = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(STATS_API_URL, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || ''
        }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const reports: ReportCard[] = [
    {
      id: 'clients',
      title: 'Отчёт по клиентам',
      description: 'Статистика по клиентам, активности и взаимодействиям',
      icon: 'UserCheck',
      color: 'text-blue-500'
    },
    {
      id: 'projects',
      title: 'Отчёт по проектам',
      description: 'Анализ выполнения проектов, сроков и статусов',
      icon: 'FolderKanban',
      color: 'text-purple-500'
    },
    {
      id: 'payments',
      title: 'Финансовый отчёт',
      description: 'Детализация платежей, выручки и расходов',
      icon: 'CreditCard',
      color: 'text-green-500'
    },
    {
      id: 'orders',
      title: 'Отчёт по заказам',
      description: 'Статистика заказов, конверсия и средний чек',
      icon: 'ShoppingCart',
      color: 'text-orange-500'
    },
    {
      id: 'employees',
      title: 'Отчёт по сотрудникам',
      description: 'Производительность, нагрузка и KPI команды',
      icon: 'Users',
      color: 'text-indigo-500'
    },
    {
      id: 'revenue',
      title: 'Сводный отчёт',
      description: 'Общая картина бизнеса: выручка, прибыль, рост',
      icon: 'TrendingUp',
      color: 'text-emerald-500'
    }
  ];

  const generateReport = (reportId: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Отчёт "${reports.find(r => r.id === reportId)?.title}" в разработке`);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Отчёты</h1>
            <p className="text-muted-foreground mt-1">Аналитика и статистика по всем направлениям</p>
          </div>
          <Button variant="outline" disabled={loading}>
            <Icon name="Download" className="mr-2" size={18} />
            Экспорт всех отчётов
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg bg-muted ${report.color}`}>
                    <Icon name={report.icon} size={24} />
                  </div>
                </div>
                <CardTitle className="mt-4">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => generateReport(report.id)} 
                    disabled={loading}
                    className="flex-1"
                  >
                    <Icon name="FileText" className="mr-2" size={16} />
                    Создать отчёт
                  </Button>
                  <Button variant="outline" size="icon">
                    <Icon name="Download" size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Быстрая статистика</CardTitle>
            <CardDescription>Ключевые показатели за текущий месяц</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-blue-500 mb-2">
                    <Icon name="UserCheck" size={20} />
                    <span className="font-medium">Клиенты</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.clients.total}</p>
                  <p className="text-sm text-muted-foreground">+{stats.clients.growth}% за месяц</p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-purple-500 mb-2">
                    <Icon name="FolderKanban" size={20} />
                    <span className="font-medium">Проекты</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.projects.total}</p>
                  <p className="text-sm text-muted-foreground">+{stats.projects.growth}% за месяц</p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-green-500 mb-2">
                    <Icon name="DollarSign" size={20} />
                    <span className="font-medium">Выручка</span>
                  </div>
                  <p className="text-2xl font-bold">{(stats.revenue.total / 1000000).toFixed(1)}M ₽</p>
                  <p className="text-sm text-muted-foreground">+{stats.revenue.growth}% за месяц</p>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-orange-500 mb-2">
                    <Icon name="ShoppingCart" size={20} />
                    <span className="font-medium">Заказы</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.orders.total}</p>
                  <p className="text-sm text-muted-foreground">+{stats.orders.growth}% за месяц</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Загрузка статистики...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}