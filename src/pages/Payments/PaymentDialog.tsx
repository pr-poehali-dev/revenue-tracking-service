import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { Payment } from './types';

interface Order {
  id: number;
  name: string;
  amount: number;
  project_name?: string;
  client_name?: string;
}

interface PaymentDialogProps {
  open: boolean;
  editingPayment: Payment | null;
  formData: Payment;
  loading: boolean;
  orders: Order[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: Payment) => void;
}

export default function PaymentDialog({
  open,
  editingPayment,
  formData,
  loading,
  orders,
  onClose,
  onSubmit,
  onFormDataChange,
}: PaymentDialogProps) {
  const [amountType, setAmountType] = useState<'amount' | 'percent'>(
    formData.planned_amount_percent ? 'percent' : 'amount'
  );

  const handleAmountTypeChange = (type: 'amount' | 'percent') => {
    setAmountType(type);
    if (type === 'amount') {
      onFormDataChange({ ...formData, planned_amount_percent: undefined });
    } else {
      onFormDataChange({ ...formData, planned_amount: undefined });
    }
  };

  const selectedOrder = orders.find(o => o.id === formData.order_id);
  const calculatedAmount = formData.planned_amount_percent && selectedOrder
    ? (selectedOrder.amount * formData.planned_amount_percent) / 100
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingPayment ? 'Редактирование платежа' : 'Новый платёж'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="order_id">Заказ *</Label>
              <select
                id="order_id"
                value={formData.order_id || ''}
                onChange={(e) => {
                  const orderId = e.target.value ? Number(e.target.value) : undefined;
                  onFormDataChange({ ...formData, order_id: orderId });
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Выберите заказ</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.name} ({order.amount.toLocaleString('ru-RU')} ₽)
                    {order.project_name && ` - ${order.project_name}`}
                    {order.client_name && ` - ${order.client_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Планируемая сумма</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={amountType === 'amount' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAmountTypeChange('amount')}
                >
                  Сумма
                </Button>
                <Button
                  type="button"
                  variant={amountType === 'percent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAmountTypeChange('percent')}
                >
                  Процент
                </Button>
              </div>
              
              {amountType === 'amount' ? (
                <Input
                  type="number"
                  step="0.01"
                  value={formData.planned_amount || ''}
                  onChange={(e) => onFormDataChange({ ...formData, planned_amount: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.planned_amount_percent || ''}
                      onChange={(e) => onFormDataChange({ ...formData, planned_amount_percent: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="0"
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  {calculatedAmount !== null && (
                    <p className="text-sm text-muted-foreground">
                      = {calculatedAmount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 })}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_amount">Фактическая сумма</Label>
              <Input
                id="actual_amount"
                type="number"
                step="0.01"
                value={formData.actual_amount}
                onChange={(e) => onFormDataChange({ ...formData, actual_amount: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planned_date">Планируемая дата платежа до</Label>
              <Input
                id="planned_date"
                type="date"
                value={formData.planned_date || ''}
                onChange={(e) => onFormDataChange({ ...formData, planned_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_date">Фактическая дата платежа</Label>
              <Input
                id="actual_date"
                type="date"
                value={formData.actual_date || ''}
                onChange={(e) => onFormDataChange({ ...formData, actual_date: e.target.value })}
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
                editingPayment ? 'Сохранить изменения' : 'Создать платёж'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
