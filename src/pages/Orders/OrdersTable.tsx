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
import { Order, ORDER_STATUSES, PAYMENT_STATUSES } from './types';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  viewMode: 'active' | 'archived';
  onViewDetails: (orderId: number) => void;
  onArchive: (orderId: number) => void;
  onActivate: (orderId: number) => void;
  onDelete: (orderId: number) => void;
}

export default function OrdersTable({
  orders,
  loading,
  viewMode,
  onViewDetails,
  onArchive,
  onActivate,
  onDelete,
}: OrdersTableProps) {
  const getOrderStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      done: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      not_paid: 'bg-red-100 text-red-800',
      awaiting_payment: 'bg-orange-100 text-orange-800',
      partially_paid: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {PAYMENT_STATUSES[status as keyof typeof PAYMENT_STATUSES] || status}
      </span>
    );
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="ShoppingCart" size={20} />
          Список заказов
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Icon name="Loader2" className="animate-spin" size={32} />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="ShoppingCart" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Заказов пока нет</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Проект</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус заказа</TableHead>
                <TableHead>Оплата</TableHead>
                <TableHead>Плановая дата</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.name}</TableCell>
                  <TableCell>
                    {order.project_name ? (
                      <div>
                        <div className="text-sm">{order.project_name}</div>
                        {order.client_name && (
                          <div className="text-xs text-muted-foreground">{order.client_name}</div>
                        )}
                      </div>
                    ) : (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{formatAmount(order.amount)}</TableCell>
                  <TableCell>{getOrderStatusBadge(order.order_status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                  <TableCell>
                    {order.planned_date ? new Date(order.planned_date).toLocaleDateString('ru-RU') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(order.id!)}
                        title="Просмотр"
                      >
                        <Icon name="Eye" size={16} />
                      </Button>
                      {viewMode === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchive(order.id!)}
                          title="В архив"
                        >
                          <Icon name="Archive" size={16} />
                        </Button>
                      )}
                      {viewMode === 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onActivate(order.id!)}
                          title="Вернуть в активные"
                        >
                          <Icon name="ArchiveRestore" size={16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(order.id!)}
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
