import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/ee2d3742-725a-421c-b7d0-8d2efc6c32db';

export interface Company {
  id: number;
  name: string;
  role: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  avatar_url?: string;
  is_email_verified: boolean;
  current_company_id?: number | null;
  companies?: Company[];
}

export function useProfileData() {
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

  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    loading,
    setLoading,
    editMode,
    setEditMode,
    passwordDialogOpen,
    setPasswordDialogOpen,
    emailDialogOpen,
    setEmailDialogOpen,
    emailCodeSent,
    setEmailCodeSent,
    formData,
    setFormData,
    passwordData,
    setPasswordData,
    emailData,
    setEmailData,
    loadProfile,
    toast
  };
}