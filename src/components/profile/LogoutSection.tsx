import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export default function LogoutSection() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    navigate('/login');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="LogOut" size={20} />
          Выход из системы
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleLogout} variant="destructive">
          <Icon name="LogOut" size={16} className="mr-2" />
          Выйти из аккаунта
        </Button>
      </CardContent>
    </Card>
  );
}
