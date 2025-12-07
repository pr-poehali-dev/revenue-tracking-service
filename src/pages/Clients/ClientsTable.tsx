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
import { Client } from './types';

interface ClientsTableProps {
  clients: Client[];
  loading: boolean;
  viewMode: 'active' | 'archived';
  onViewDetails: (clientId: number) => void;
  onArchive: (clientId: number) => void;
  onActivate: (clientId: number) => void;
  onDelete: (clientId: number) => void;
}

export default function ClientsTable({
  clients,
  loading,
  viewMode,
  onViewDetails,
  onArchive,
  onActivate,
  onDelete,
}: ClientsTableProps) {
  return (
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
                          onClick={() => onViewDetails(client.id!)}
                          title="Просмотр"
                        >
                          <Icon name="Eye" size={16} />
                        </Button>
                        {viewMode === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onArchive(client.id!)}
                            title="В архив"
                          >
                            <Icon name="Archive" size={16} />
                          </Button>
                        )}
                        {viewMode === 'archived' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onActivate(client.id!)}
                            title="Вернуть в активные"
                          >
                            <Icon name="ArchiveRestore" size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(client.id!)}
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
