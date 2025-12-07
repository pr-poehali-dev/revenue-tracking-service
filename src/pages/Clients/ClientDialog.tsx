import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { Client, Contact } from './types';

interface ClientDialogProps {
  open: boolean;
  editingClient: Client | null;
  formData: Client;
  loading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: Client) => void;
  onAddContact: () => void;
  onRemoveContact: (index: number) => void;
  onContactChange: (index: number, field: keyof Contact, value: string) => void;
}

export default function ClientDialog({
  open,
  editingClient,
  formData,
  loading,
  onClose,
  onSubmit,
  onFormDataChange,
  onAddContact,
  onRemoveContact,
  onContactChange,
}: ClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingClient ? 'Редактирование клиента' : 'Новый клиент'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название клиента *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder="ООО Компания"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => onFormDataChange({ ...formData, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="active">Активен</option>
                <option value="archived">Архив</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация о клиенте"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Контактные лица</Label>
              <Button type="button" variant="outline" size="sm" onClick={onAddContact}>
                <Icon name="Plus" className="mr-2 h-4 w-4" />
                Добавить контакт
              </Button>
            </div>

            {formData.contacts.map((contact, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                {formData.contacts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => onRemoveContact(index)}
                  >
                    <Icon name="X" className="h-4 w-4" />
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`contact-name-${index}`}>ФИО</Label>
                    <Input
                      id={`contact-name-${index}`}
                      value={contact.full_name}
                      onChange={(e) => onContactChange(index, 'full_name', e.target.value)}
                      placeholder="Иванов Иван Иванович"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`contact-position-${index}`}>Должность</Label>
                    <Input
                      id={`contact-position-${index}`}
                      value={contact.position}
                      onChange={(e) => onContactChange(index, 'position', e.target.value)}
                      placeholder="Директор"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`contact-phone-${index}`}>Телефон</Label>
                    <Input
                      id={`contact-phone-${index}`}
                      value={contact.phone}
                      onChange={(e) => onContactChange(index, 'phone', e.target.value)}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`contact-email-${index}`}>Email</Label>
                    <Input
                      id={`contact-email-${index}`}
                      type="email"
                      value={contact.email}
                      onChange={(e) => onContactChange(index, 'email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                editingClient ? 'Сохранить изменения' : 'Создать клиента'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
