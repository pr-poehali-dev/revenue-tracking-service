import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface DashboardLayoutProps {
  children: ReactNode;
}

type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard', path: '/' },
    { id: 'projects', label: 'Проекты', icon: 'Briefcase', path: '/projects' },
    { id: 'clients', label: 'Клиенты', icon: 'Users', path: '/clients' },
    { id: 'payments', label: 'Платежи', icon: 'CreditCard', path: '/payments' },
    { id: 'reports', label: 'Отчёты', icon: 'FileText', path: '/reports' },
    { id: 'orders', label: 'Заказы', icon: 'ShoppingCart', path: '/orders' },
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
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${
                location.pathname === item.path
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
        {children}
      </main>
    </div>
  );
}
