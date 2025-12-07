import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="User" size={20} />
              Аватар
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                variant="outline"
              >
                <Icon name="Upload" size={16} className="mr-2" />
                Загрузить
              </Button>
              {profile?.avatar_url && (
                <Button
                  onClick={handleDeleteAvatar}
                  disabled={loading}
                  variant="outline"
                >
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Удалить
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon name="UserCircle" size={20} />
              Персональные данные
            </CardTitle>
            {!editMode && (
              <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                <Icon name="Edit" size={16} className="mr-2" />
                Редактировать
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Фамилия *</Label>
                {editMode ? (
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    disabled={loading}
                  />
                ) : (
                  <p className="text-sm font-medium">{profile?.last_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Имя *</Label>
                {editMode ? (
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    disabled={loading}
                  />
                ) : (
                  <p className="text-sm font-medium">{profile?.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Отчество</Label>
                {editMode ? (
                  <Input
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    disabled={loading}
                  />
                ) : (
                  <p className="text-sm font-medium">{profile?.middle_name || '—'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                {editMode ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={loading}
                    placeholder="+7 (999) 123-45-67"
                  />
                ) : (
                  <p className="text-sm font-medium">{profile?.phone || '—'}</p>
                )}
              </div>
            </div>
            {editMode && (
              <div className="flex gap-2 mt-4">
                <Button onClick={handleUpdateProfile} disabled={loading}>
                  {loading ? (
                    <>
                      <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить'
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      first_name: profile?.first_name || '',
                      last_name: profile?.last_name || '',
                      middle_name: profile?.middle_name || '',
                      phone: profile?.phone || ''
                    });
                  }}
                  variant="outline"
                  disabled={loading}
                >
                  Отмена
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Mail" size={20} />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{profile?.email}</p>
                {profile?.is_email_verified ? (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <Icon name="CheckCircle" size={12} />
                    Подтвержден
                  </p>
                ) : (
                  <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                    <Icon name="AlertCircle" size={12} />
                    Не подтвержден
                  </p>
                )}
              </div>
              <Button
                onClick={() => setEmailDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                <Icon name="Edit" size={16} className="mr-2" />
                Изменить
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Lock" size={20} />
              Безопасность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setPasswordDialogOpen(true)}
              variant="outline"
            >
              <Icon name="Key" size={16} className="mr-2" />
              Изменить пароль
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменение пароля</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Новый пароль</Label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                placeholder="Минимум 6 символов"
              />
            </div>
            <div className="space-y-2">
              <Label>Повторите пароль</Label>
              <Input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setPasswordData({ new_password: '', confirm_password: '' });
              }}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button onClick={handleChangePassword} disabled={loading}>
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Изменить пароль'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменение email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Новый email</Label>
              <Input
                type="email"
                value={emailData.new_email}
                onChange={(e) => setEmailData({ ...emailData, new_email: e.target.value })}
                disabled={emailCodeSent || loading}
              />
            </div>
            {emailCodeSent && (
              <div className="space-y-2">
                <Label>Код подтверждения</Label>
                <Input
                  value={emailData.code}
                  onChange={(e) => setEmailData({ ...emailData, code: e.target.value })}
                  placeholder="4 цифры"
                  maxLength={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEmailDialogOpen(false);
                setEmailCodeSent(false);
                setEmailData({ new_email: '', code: '' });
              }}
              disabled={loading}
            >
              Отмена
            </Button>
            {!emailCodeSent ? (
              <Button onClick={handleRequestEmailChange} disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Отправить код'
                )}
              </Button>
            ) : (
              <Button onClick={handleConfirmEmailChange} disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  'Подтвердить'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}