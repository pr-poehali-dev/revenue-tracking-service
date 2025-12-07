import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { Payment } from './types';

interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
  viewMode: 'active' | 'archived';
  onViewDetails: (paymentId: number) => void;
  onArchive: (paymentId: number) => void;
  onActivate: (paymentId: number) => void;
  onDelete: (paymentId: number) => void;
}

export default function PaymentsTable({
  payments,
  loading,
  viewMode,
  onViewDetails,
  onArchive,
  onActivate,
  onDelete,
}: PaymentsTableProps) {
  const formatAmount = (amount?: number) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculatePlannedAmount = (payment: Payment) => {
    if (payment.planned_amount) {
      return formatAmount(payment.planned_amount);
    }
    if (payment.planned_amount_percent && payment.order_amount) {
      const amount = (payment.order_amount * payment.planned_amount_percent) / 100;
      return `${formatAmount(amount)} (${payment.planned_amount_percent}%)`;
    }
    return '—';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="CreditCard" size={20} />
          Список платежей
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Icon name="Loader2" className="animate-spin" size={32} />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="CreditCard" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Платежей пока нет</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Заказ</TableHead>
                <TableHead>Планируемая сумма</TableHead>
                <TableHead>Фактическая сумма</TableHead>
                <TableHead>Планируемая дата</TableHead>
                <TableHead>Фактическая дата</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {payment.order_name ? (
                      <div>
                        <div className="text-sm font-medium">{payment.order_name}</div>
                        {payment.project_name && (
                          <div className="text-xs text-muted-foreground">{payment.project_name}</div>
                        )}
                        {payment.client_name && (
                          <div className="text-xs text-muted-foreground">{payment.client_name}</div>
                        )}
                      </div>
                    ) : (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{calculatePlannedAmount(payment)}</TableCell>
                  <TableCell className="font-semibold text-green-700">{formatAmount(payment.actual_amount)}</TableCell>
                  <TableCell>
                    {payment.planned_date ? new Date(payment.planned_date).toLocaleDateString('ru-RU') : '—'}
                  </TableCell>
                  <TableCell>
                    {payment.actual_date ? new Date(payment.actual_date).toLocaleDateString('ru-RU') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(payment.id!)}
                        title="Просмотр"
                      >
                        <Icon name="Eye" size={16} />
                      </Button>
                      {viewMode === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchive(payment.id!)}
                          title="В архив"
                        >
                          <Icon name="Archive" size={16} />
                        </Button>
                      )}
                      {viewMode === 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onActivate(payment.id!)}
                          title="Вернуть в активные"
                        >
                          <Icon name="ArchiveRestore" size={16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(payment.id!)}
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
