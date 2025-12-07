import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: number;
  name: string;
  role: string;
}

interface CompaniesSectionProps {
  currentCompanyId: number | null;
  companies: Company[];
  loading: boolean;
  onSwitchCompany: (companyId: number) => void;
  onCreateCompany: (name: string) => void;
}

export default function CompaniesSection({
  currentCompanyId,
  companies,
  loading,
  onSwitchCompany,
  onCreateCompany
}: CompaniesSectionProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  const handleCreate = () => {
    if (newCompanyName.trim()) {
      onCreateCompany(newCompanyName.trim());
      setNewCompanyName('');
      setCreateDialogOpen(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'outline' } } = {
      owner: { label: 'Владелец', variant: 'default' },
      admin: { label: 'Администратор', variant: 'secondary' },
      user: { label: 'Пользователь', variant: 'outline' }
    };
    const roleInfo = roles[role] || { label: role, variant: 'outline' };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon name="Building2" size={20} />
            Компании
          </CardTitle>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <Icon name="Plus" size={16} className="mr-2" />
            Создать компанию
          </Button>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Building2" size={48} className="mx-auto mb-4 opacity-50" />
              <p>У вас пока нет компаний</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    currentCompanyId === company.id
                      ? 'bg-primary/5 border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      currentCompanyId === company.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      <Icon name="Building2" size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{company.name}</p>
                        {currentCompanyId === company.id && (
                          <Badge variant="default" className="text-xs">Активна</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(company.role)}
                      </div>
                    </div>
                  </div>
                  {currentCompanyId !== company.id && (
                    <Button
                      onClick={() => onSwitchCompany(company.id)}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                    >
                      Переключиться
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создание компании</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название компании</Label>
              <Input
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="ООО Рога и копыта"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewCompanyName('');
              }}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={loading || !newCompanyName.trim()}>
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
