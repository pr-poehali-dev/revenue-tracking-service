import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: '',
    last_name: '',
    first_name: '',
    middle_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: ''
  });
  
  const [verificationCode, setVerificationCode] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.password_confirm) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен быть не менее 6 символов',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Отправка регистрации:', formData);
      const response = await fetch('https://functions.poehali.dev/a9148039-69fe-4592-b9b4-1294406b914d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          phone: formData.phone,
          company_name: formData.company_name
        })
      });
      
      console.log('Статус ответа:', response.status);
      const data = await response.json();
      console.log('Данные ответа:', data);
      
      if (response.ok && data.success) {
        const description = data.email_sent 
          ? 'Код подтверждения отправлен на вашу почту'
          : `Код подтверждения: ${data.code}`;
        
        toast({
          title: 'Успешно!',
          description: description,
          duration: data.email_sent ? 3000 : 10000
        });
        setStep('verify');
      } else {
        console.error('Ошибка регистрации:', data);
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось зарегистрироваться',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка сети:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 4) {
      toast({
        title: 'Ошибка',
        description: 'Введите 4-значный код',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('https://functions.poehali.dev/a9148039-69fe-4592-b9b4-1294406b914d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email: formData.email,
          code: verificationCode
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_id', data.user_id);
        
        toast({
          title: 'Добро пожаловать!',
          description: 'Регистрация успешно завершена'
        });
        
        setTimeout(() => navigate('/'), 1000);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Неверный код',
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2 mb-2">
            <Icon name="BarChart3" size={32} className="text-primary" />
            Revenue Track
          </h1>
          <p className="text-muted-foreground">
            {step === 'register' ? 'Регистрация нового аккаунта' : 'Подтверждение email'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name={step === 'register' ? 'UserPlus' : 'Mail'} size={24} />
              {step === 'register' ? 'Создание аккаунта' : 'Введите код из email'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Название компании *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="ООО «Ваша компания»"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="last_name">Фамилия *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Иванов"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="first_name">Имя *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Иван"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="middle_name">Отчество</Label>
                    <Input
                      id="middle_name"
                      value={formData.middle_name}
                      onChange={(e) => handleInputChange('middle_name', e.target.value)}
                      placeholder="Иванович"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Электронная почта *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+7 999 123-45-67"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Пароль *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Минимум 6 символов"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password_confirm">Повторите пароль *</Label>
                    <Input
                      id="password_confirm"
                      type="password"
                      value={formData.password_confirm}
                      onChange={(e) => handleInputChange('password_confirm', e.target.value)}
                      placeholder="Повторите пароль"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                      Регистрация...
                    </>
                  ) : (
                    <>
                      <Icon name="UserPlus" className="mr-2" size={20} />
                      Зарегистрироваться
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-primary hover:underline"
                  >
                    Войти
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Mail" size={32} className="text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Мы отправили 4-значный код на<br />
                    <strong className="text-foreground">{formData.email}</strong>
                  </p>
                </div>

                <div>
                  <Label htmlFor="code">Код подтверждения</Label>
                  <Input
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="0000"
                    className="text-center text-2xl tracking-widest font-bold"
                    maxLength={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" size={20} />
                      Проверка...
                    </>
                  ) : (
                    <>
                      <Icon name="CheckCircle" className="mr-2" size={20} />
                      Подтвердить
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Не пришёл код?{' '}
                  <button
                    type="button"
                    onClick={() => setStep('register')}
                    className="text-primary hover:underline"
                  >
                    Вернуться к регистрации
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;