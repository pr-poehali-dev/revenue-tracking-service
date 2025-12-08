import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/layouts/DashboardLayout';
import ClientsTable from './Clients/ClientsTable';
import ClientDialog from './Clients/ClientDialog';
import { Client, Contact } from './Clients/types';

const API_URL = 'https://functions.poehali.dev/c1ed6936-95c5-4b22-a918-72cc11832898';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const { toast } = useToast();

  const [formData, setFormData] = useState<Client>({
    name: '',
    notes: '',
    status: 'active',
    contacts: [{ full_name: '', position: '', phone: '', email: '' }]
  });

  useEffect(() => {
    loadClients();
  }, [viewMode]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${API_URL}?status=${viewMode}`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        setClients(data.clients || []);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить клиентов',
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

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        id: client.id,
        name: client.name,
        notes: client.notes || '',
        status: client.status || 'active',
        contacts: client.contacts || [{ full_name: '', position: '', phone: '', email: '' }]
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        notes: '',
        status: 'active',
        contacts: [{ full_name: '', position: '', phone: '', email: '' }]
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
  };

  const handleAddContact = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { full_name: '', position: '', phone: '', email: '' }]
    });
  };

  const handleRemoveContact = (index: number) => {
    if (formData.contacts.length > 1) {
      setFormData({
        ...formData,
        contacts: formData.contacts.filter((_, i) => i !== index)
      });
    }
  };

  const handleContactChange = (index: number, field: keyof Contact, value: string) => {
    const newContacts = [...formData.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormData({ ...formData, contacts: newContacts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название клиента обязательно',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const method = editingClient ? 'PUT' : 'POST';
      
      const response = await fetch(API_URL, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: editingClient ? 'Клиент обновлён' : 'Клиент добавлен'
        });
        handleCloseDialog();
        loadClients();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось сохранить клиента',
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

  const handleArchive = async (clientId: number) => {
    if (!confirm('Переместить клиента в архив?')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify({
          id: clientId,
          name: clients.find(c => c.id === clientId)?.name || '',
          notes: clients.find(c => c.id === clientId)?.notes || '',
          status: 'archived'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Клиент перемещён в архив'
        });
        setViewMode('active');
        loadClients();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось архивировать клиента',
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

  const handleDelete = async (clientId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента? Это действие нельзя отменить.')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${API_URL}?id=${clientId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Клиент удалён'
        });
        loadClients();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить клиента',
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

  const handleActivate = async (clientId: number) => {
    if (!confirm('Вернуть клиента в активный статус?')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify({
          id: clientId,
          name: clients.find(c => c.id === clientId)?.name || '',
          notes: clients.find(c => c.id === clientId)?.notes || '',
          status: 'active'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Клиент возвращён в активные'
        });
        loadClients();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось активировать клиента',
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

  const handleViewDetails = async (clientId: number) => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${API_URL}?id=${clientId}`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        handleOpenDialog(data);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить данные клиента',
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
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Клиенты</h2>
            <p className="text-muted-foreground mt-1">Управление базой клиентов компании</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'active' ? 'default' : 'outline'}
              onClick={() => setViewMode('active')}
              disabled={loading}
            >
              Активные
            </Button>
            <Button
              variant={viewMode === 'archived' ? 'default' : 'outline'}
              onClick={() => setViewMode('archived')}
              disabled={loading}
            >
              Архив
            </Button>
            {viewMode === 'active' && (
              <Button onClick={() => handleOpenDialog()} disabled={loading}>
                <Icon name="Plus" size={20} className="mr-2" />
                Добавить клиента
              </Button>
            )}
          </div>
        </div>

        <ClientsTable
          clients={clients}
          loading={loading}
          viewMode={viewMode}
          onViewDetails={handleViewDetails}
          onArchive={handleArchive}
          onActivate={handleActivate}
          onDelete={handleDelete}
        />

        <ClientDialog
          open={dialogOpen}
          editingClient={editingClient}
          formData={formData}
          loading={loading}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
          onAddContact={handleAddContact}
          onRemoveContact={handleRemoveContact}
          onContactChange={handleContactChange}
        />
      </div>
    </DashboardLayout>
  );
}