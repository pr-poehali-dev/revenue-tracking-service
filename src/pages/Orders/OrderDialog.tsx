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
import { Order, ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_TYPES } from './types';

interface Project {
  id: number;
  name: string;
  client_name?: string;
}

interface OrderDialogProps {
  open: boolean;
  editingOrder: Order | null;
  formData: Order;
  loading: boolean;
  projects: Project[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: Order) => void;
}

export default function OrderDialog({
  open,
  editingOrder,
  formData,
  loading,
  projects,
  onClose,
  onSubmit,
  onFormDataChange,
}: OrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingOrder ? 'Редактирование заказа' : 'Новый заказ'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Название заказа *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder="Название заказа"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_id">Проект</Label>
              <select
                id="project_id"
                value={formData.project_id || ''}
                onChange={(e) => onFormDataChange({ ...formData, project_id: e.target.value ? Number(e.target.value) : undefined })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Не выбран</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.client_name ? `(${project.client_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Сумма заказа</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => onFormDataChange({ ...formData, amount: Number(e.target.value) })}
                placeholder="0"
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
                {Object.entries(ORDER_STATUSES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status">Статус оплаты</Label>
              <select
                id="payment_status"
                value={formData.payment_status}
                onChange={(e) => onFormDataChange({ ...formData, payment_status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.entries(PAYMENT_STATUSES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_type">Тип оплаты</Label>
              <select
                id="payment_type"
                value={formData.payment_type}
                onChange={(e) => onFormDataChange({ ...formData, payment_type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.entries(PAYMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planned_date">Планируемая дата реализации</Label>
              <Input
                id="planned_date"
                type="date"
                value={formData.planned_date || ''}
                onChange={(e) => onFormDataChange({ ...formData, planned_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_date">Фактическая дата реализации</Label>
              <Input
                id="actual_date"
                type="date"
                value={formData.actual_date || ''}
                onChange={(e) => onFormDataChange({ ...formData, actual_date: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                placeholder="Описание заказа"
                rows={4}
              />
            </div>
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
                editingOrder ? 'Сохранить изменения' : 'Создать заказ'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
