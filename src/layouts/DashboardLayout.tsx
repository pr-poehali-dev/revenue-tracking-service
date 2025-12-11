import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DashboardLayoutProps {
  children: ReactNode;
}

type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
};

const API_URL = 'https://functions.poehali.dev/ee2d3742-725a-421c-b7d0-8d2efc6c32db';

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string; first_name: string; last_name: string; current_company_id?: number; companies?: { id: number; name: string }[] } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
    } else {
      loadUserProfile();
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const loadUserProfile = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || ''
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard', path: '/dashboard' },
    { id: 'employees', label: 'Сотрудники', icon: 'Users', path: '/employees' },
    { id: 'clients', label: 'Клиенты', icon: 'UserCheck', path: '/clients' },
    { id: 'projects', label: 'Проекты', icon: 'FolderKanban', path: '/projects' },
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
      <aside className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="p-6 border-b border-sidebar-border">
          {isSidebarCollapsed ? (
            <div className="flex justify-center">
              <Icon name="BarChart3" size={28} className="text-primary" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-sidebar-foreground flex items-center gap-2">
                <Icon name="BarChart3" size={28} className="text-primary" />
                Luma Finance
              </h1>
              <p className="text-sm text-sidebar-foreground/60 mt-1">Управление выручкой</p>
            </>
          )}
        </div>
        
        <nav className="p-4 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center rounded-lg mb-1 transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              } ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className="flex items-center justify-center" style={{ minWidth: '20px' }}>
                <Icon name={item.icon} size={20} />
              </div>
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`w-full flex items-center rounded-lg mb-2 transition-all duration-200 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground ${
              isSidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-4 py-2'
            }`}
            title={isSidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            <div className="flex items-center justify-center" style={{ minWidth: '20px' }}>
              <Icon name={isSidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={20} />
            </div>
            {!isSidebarCollapsed && <span className="text-sm">Свернуть</span>}
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className={`w-full flex items-center rounded-lg transition-all duration-200 ${
              location.pathname === '/profile'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            } ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}`}
            title={isSidebarCollapsed ? 'Профиль' : undefined}
          >
            <div className="flex items-center justify-center">
              <Avatar className="w-8 h-8">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground font-medium">
                  {userProfile?.first_name?.[0]?.toUpperCase()}{userProfile?.last_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col items-start">
                {userProfile && (
                  <>
                    <span className="text-sm font-medium">
                      {userProfile.first_name} {userProfile.last_name}
                    </span>
                    <span className="text-xs opacity-70">
                      {userProfile.companies?.find(c => c.id === userProfile.current_company_id)?.name || 'Компания'}
                    </span>
                  </>
                )}
              </div>
            )}
          </button>
        </div>
      </aside>

      <main className={`p-8 transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {children}
      </main>
    </div>
  );
}