const API_URL = 'https://functions.poehali.dev/ee2d3742-725a-421c-b7d0-8d2efc6c32db';

interface UseProfileActionsProps {
  setLoading: (loading: boolean) => void;
  setEditMode: (mode: boolean) => void;
  setPasswordDialogOpen: (open: boolean) => void;
  setEmailDialogOpen: (open: boolean) => void;
  setEmailCodeSent: (sent: boolean) => void;
  setPasswordData: (data: { new_password: string; confirm_password: string }) => void;
  setEmailData: (data: { new_email: string; code: string }) => void;
  loadProfile: () => Promise<void>;
  toast: any;
  formData: {
    first_name: string;
    last_name: string;
    middle_name: string;
    phone: string;
  };
  passwordData: {
    new_password: string;
    confirm_password: string;
  };
  emailData: {
    new_email: string;
    code: string;
  };
}

export function useProfileActions({
  setLoading,
  setEditMode,
  setPasswordDialogOpen,
  setEmailDialogOpen,
  setEmailCodeSent,
  setPasswordData,
  setEmailData,
  loadProfile,
  toast,
  formData,
  passwordData,
  emailData
}: UseProfileActionsProps) {
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

  const handleSwitchCompany = async (companyId: number) => {
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
          action: 'switch_company',
          company_id: companyId
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('company_id', companyId.toString());
        toast({
          title: 'Успешно!',
          description: 'Компания переключена'
        });
        loadProfile();
        window.location.reload();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось переключить компанию',
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

  const handleCreateCompany = async (name: string) => {
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
          action: 'create_company',
          name
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.company_id) {
          localStorage.setItem('company_id', data.company_id.toString());
        }
        toast({
          title: 'Успешно!',
          description: 'Компания создана'
        });
        loadProfile();
        window.location.reload();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать компанию',
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

  return {
    handleUpdateProfile,
    handleChangePassword,
    handleRequestEmailChange,
    handleConfirmEmailChange,
    handleAvatarUpload,
    handleDeleteAvatar,
    handleSwitchCompany,
    handleCreateCompany
  };
}