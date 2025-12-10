import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface Employee {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  joined_at?: string;
  status?: 'active' | 'invited';
  invited_at?: string;
  expires_at?: string;
}

interface EmployeeCardProps {
  employee: Employee;
  canEdit: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  getRoleBadge: (role: string) => JSX.Element;
}

export default function EmployeeCard({ employee, canEdit, onEdit, onDelete, getRoleBadge }: EmployeeCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isInvited = employee.status === 'invited';

  return (
    <Card className={isInvited ? 'border-amber-200 bg-amber-50/30' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            {isInvited ? (
              <AvatarFallback className="bg-amber-100 text-amber-700">
                <Icon name="Mail" size={24} />
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={employee.avatar_url} alt={`${employee.first_name} ${employee.last_name}`} />
                <AvatarFallback>{getInitials(employee.first_name, employee.last_name)}</AvatarFallback>
              </>
            )}
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {isInvited ? (
                    <span className="text-muted-foreground">Приглашение отправлено</span>
                  ) : (
                    <>
                      {employee.last_name} {employee.first_name}
                      {employee.middle_name && ` ${employee.middle_name}`}
                    </>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
              <div className="flex gap-2">
                {isInvited && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                    <Icon name="Clock" size={12} className="mr-1" />
                    Ожидание
                  </Badge>
                )}
                {getRoleBadge(employee.role)}
              </div>
            </div>

            <div className="space-y-1 mb-4">
              {isInvited ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Send" size={14} />
                    <span>Приглашение отправлено: {formatDateTime(employee.invited_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Clock" size={14} />
                    <span>Действительно до: {formatDateTime(employee.expires_at)}</span>
                  </div>
                </>
              ) : (
                <>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Phone" size={14} />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Calendar" size={14} />
                    <span>Присоединился: {formatDate(employee.joined_at)}</span>
                  </div>
                </>
              )}
            </div>

            {canEdit && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(employee)}
                >
                  <Icon name="Edit" size={16} className="mr-1" />
                  Изменить роль
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(employee)}
                  className="text-destructive hover:text-destructive"
                >Уволить</Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}