import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const ACCEPT_INVITATION_URL = 'https://functions.poehali.dev/1cc2517b-f99e-4e98-b289-6e75044d1ccc';

interface InvitationInfo {
  email: string;
  company_name: string;
  role: string;
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Ошибка',
        description: 'Отсутствует токен приглашения',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    // Проверяем токен при загрузке
    const checkToken = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${ACCEPT_INVITATION_URL}?token=${token}`, {
          method: 'GET'
        });

        const data = await response.json();

        if (response.ok) {
          setInvitationInfo(data);
        } else {
          toast({
            title: 'Ошибка',
            description: data.error || 'Приглашение недействительно',
            variant: 'destructive'
          });
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось проверить приглашение',
          variant: 'destructive'
        });
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !password) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен быть не менее 6 символов',
        variant: 'destructive'
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(ACCEPT_INVITATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          phone,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Регистрация завершена. Войдите в систему'
        });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось завершить регистрацию',
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

  if (loading && !invitationInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Icon name="Loader2" className="animate-spin mx-auto mb-4" size={48} />
              <p className="text-muted-foreground">Проверка приглашения...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitationInfo) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Icon name="UserPlus" className="text-primary-foreground" size={24} />
            </div>
            <div>
              <CardTitle>Присоединяйтесь к команде</CardTitle>
              <CardDescription>{invitationInfo.company_name}</CardDescription>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Вы приглашены на должность: <span className="font-semibold">{invitationInfo.role}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitationInfo.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="firstName">Имя *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Иван"
                required
              />
            </div>

            <div>
              <Label htmlFor="lastName">Фамилия *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Иванов"
                required
              />
            </div>

            <div>
              <Label htmlFor="middleName">Отчество</Label>
              <Input
                id="middleName"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Иванович"
              />
            </div>

            <div>
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div>
              <Label htmlFor="password">Пароль *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Повторите пароль *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                  Регистрация...
                </>
              ) : (
                <>
                  <Icon name="Check" className="mr-2" size={16} />
                  Завершить регистрацию
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
