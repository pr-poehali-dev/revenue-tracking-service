import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/layouts/DashboardLayout';

interface Contact {
  id?: number;
  full_name: string;
  position: string;
  phone: string;
  email: string;
}

interface Client {
  id?: number;
  name: string;
  notes: string;
  status?: string;
  contacts: Contact[];
  contacts_count?: number;
  created_at?: string;
}

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
      const response = await fetch(`${API_URL}?status=${viewMode}`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || ''
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
      const method = editingClient ? 'PUT' : 'POST';
      
      const response = await fetch(API_URL, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
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
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
        },
        body: JSON.stringify({
          id: clientId,
          name: clients.find(c => c.id === clientId)?.name || '',
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
      const response = await fetch(`${API_URL}?id=${clientId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId || ''
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
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
        },
        body: JSON.stringify({
          id: clientId,
          name: clients.find(c => c.id === clientId)?.name || '',
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Users" size={20} />
            Список клиентов
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Icon name="Loader2" className="animate-spin" size={32} />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Клиентов пока нет</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Примечания</TableHead>
                  <TableHead>Контактов</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.notes ? (
                          client.notes.length > 50 ? client.notes.substring(0, 50) + '...' : client.notes
                        ) : (
                          <span className="italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>{client.contacts_count || 0}</TableCell>
                      <TableCell>
                        {client.created_at ? new Date(client.created_at).toLocaleDateString('ru-RU') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(client.id!)}
                            title="Просмотр"
                          >
                            <Icon name="Eye" size={16} />
                          </Button>
                          {viewMode === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(client.id!)}
                              title="В архив"
                            >
                              <Icon name="Archive" size={16} />
                            </Button>
                          )}
                          {viewMode === 'archived' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(client.id!)}
                              title="Вернуть в активные"
                            >
                              <Icon name="ArchiveRestore" size={16} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id!)}
                            title="Удалить"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Редактирование клиента' : 'Новый клиент'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Название клиента *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ООО «Название компании»"
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Статус</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="active">Активен</option>
                  <option value="archived">Архив</option>
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Примечания</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Дополнительная информация о клиенте"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Контактные лица</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddContact}>
                    <Icon name="Plus" size={16} className="mr-2" />
                    Добавить контакт
                  </Button>
                </div>

                {formData.contacts.map((contact, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Контакт {index + 1}</span>
                        {formData.contacts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveContact(index)}
                          >
                            <Icon name="X" size={16} />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>ФИО</Label>
                          <Input
                            value={contact.full_name}
                            onChange={(e) => handleContactChange(index, 'full_name', e.target.value)}
                            placeholder="Иванов Иван Иванович"
                          />
                        </div>
                        <div>
                          <Label>Должность</Label>
                          <Input
                            value={contact.position}
                            onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                            placeholder="Генеральный директор"
                          />
                        </div>
                        <div>
                          <Label>Телефон</Label>
                          <Input
                            value={contact.phone}
                            onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                            placeholder="+7 999 123-45-67"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Save" className="mr-2" size={16} />
                    Сохранить
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}