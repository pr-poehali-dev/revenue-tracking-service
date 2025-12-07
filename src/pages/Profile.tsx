import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/layouts/DashboardLayout';
import AvatarSection from '@/components/profile/AvatarSection';
import PersonalDataSection from '@/components/profile/PersonalDataSection';
import EmailSection from '@/components/profile/EmailSection';
import SecuritySection from '@/components/profile/SecuritySection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = 'https://functions.poehali.dev/ee2d3742-725a-421c-b7d0-8d2efc6c32db';

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  avatar_url?: string;
  is_email_verified: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });

  const [emailData, setEmailData] = useState({
    new_email: '',
    code: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
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
        setProfile(data);
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          middle_name: data.middle_name || '',
          phone: data.phone || ''
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить профиль',
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

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
        },
        body: JSON.stringify({
          action: 'update_profile',
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Профиль обновлен'
        });
        setEditMode(false);
        loadProfile();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить профиль',
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

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен быть не менее 6 символов',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
        },
        body: JSON.stringify({
          action: 'change_password',
          new_password: passwordData.new_password
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Пароль изменен'
        });
        setPasswordDialogOpen(false);
        setPasswordData({ new_password: '', confirm_password: '' });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось изменить пароль',
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

  const handleRequestEmailChange = async () => {
    if (!emailData.new_email) {
      toast({
        title: 'Ошибка',
        description: 'Введите новый email',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
        },
        body: JSON.stringify({
          action: 'request_email_change',
          new_email: emailData.new_email
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: data.message || 'Код подтверждения отправлен на почту'
        });
        setEmailCodeSent(true);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отправить код',
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

  const handleConfirmEmailChange = async () => {
    if (!emailData.code) {
      toast({
        title: 'Ошибка',
        description: 'Введите код подтверждения',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
        },
        body: JSON.stringify({
          action: 'confirm_email_change',
          new_email: emailData.new_email,
          code: emailData.code
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Email изменен'
        });
        setEmailDialogOpen(false);
        setEmailCodeSent(false);
        setEmailData({ new_email: '', code: '' });
        loadProfile();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось изменить email',
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Выберите изображение',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        
        const userId = localStorage.getItem('user_id');
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId || ''
          },
          body: JSON.stringify({
            action: 'upload_avatar',
            image: base64
          })
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: 'Успешно!',
            description: 'Аватар загружен'
          });
          loadProfile();
        } else {
          toast({
            title: 'Ошибка',
            description: data.error || 'Не удалось загрузить аватар',
            variant: 'destructive'
          });
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить аватар',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Удалить аватар?')) return;

    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
        },
        body: JSON.stringify({
          action: 'delete_avatar'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Аватар удален'
        });
        loadProfile();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить аватар',
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

  if (loading && !profile) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-16">
          <Icon name="Loader2" className="animate-spin" size={48} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Профиль</h2>
          <p className="text-muted-foreground mt-1">Управление данными пользователя</p>
        </div>

        <AvatarSection
          profile={profile}
          loading={loading}
          onUpload={handleAvatarUpload}
          onDelete={handleDeleteAvatar}
        />

        <PersonalDataSection
          profile={profile}
          formData={formData}
          editMode={editMode}
          loading={loading}
          onFormChange={(data) => setFormData({ ...formData, ...data })}
          onEdit={() => setEditMode(true)}
          onSave={handleUpdateProfile}
          onCancel={() => {
            setEditMode(false);
            setFormData({
              first_name: profile?.first_name || '',
              last_name: profile?.last_name || '',
              middle_name: profile?.middle_name || '',
              phone: profile?.phone || ''
            });
          }}
        />

        <EmailSection
          profile={profile}
          emailData={emailData}
          emailDialogOpen={emailDialogOpen}
          emailCodeSent={emailCodeSent}
          loading={loading}
          onEmailChange={(data) => setEmailData({ ...emailData, ...data })}
          onOpenDialog={() => setEmailDialogOpen(true)}
          onCloseDialog={() => {
            setEmailDialogOpen(false);
            setEmailCodeSent(false);
            setEmailData({ new_email: '', code: '' });
          }}
          onRequestChange={handleRequestEmailChange}
          onConfirmChange={handleConfirmEmailChange}
        />

        <SecuritySection
          passwordData={passwordData}
          passwordDialogOpen={passwordDialogOpen}
          loading={loading}
          onPasswordChange={(data) => setPasswordData({ ...passwordData, ...data })}
          onOpenDialog={() => setPasswordDialogOpen(true)}
          onCloseDialog={() => {
            setPasswordDialogOpen(false);
            setPasswordData({ new_password: '', confirm_password: '' });
          }}
          onChangePassword={handleChangePassword}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="LogOut" size={20} />
              Выход из системы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                navigate('/login');
              }}
              variant="destructive"
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти из аккаунта
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}