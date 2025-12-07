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

interface SecuritySectionProps {
  passwordData: {
    new_password: string;
    confirm_password: string;
  };
  passwordDialogOpen: boolean;
  loading: boolean;
  onPasswordChange: (data: Partial<SecuritySectionProps['passwordData']>) => void;
  onOpenDialog: () => void;
  onCloseDialog: () => void;
  onChangePassword: () => void;
}

export default function SecuritySection({
  passwordData,
  passwordDialogOpen,
  loading,
  onPasswordChange,
  onOpenDialog,
  onCloseDialog,
  onChangePassword
}: SecuritySectionProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Lock" size={20} />
            Безопасность
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onOpenDialog}
            variant="outline"
          >
            <Icon name="Key" size={16} className="mr-2" />
            Изменить пароль
          </Button>
        </CardContent>
      </Card>

      <Dialog open={passwordDialogOpen} onOpenChange={onCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменение пароля</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Новый пароль</Label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => onPasswordChange({ new_password: e.target.value })}
                placeholder="Минимум 6 символов"
              />
            </div>
            <div className="space-y-2">
              <Label>Повторите пароль</Label>
              <Input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => onPasswordChange({ confirm_password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onCloseDialog}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button onClick={onChangePassword} disabled={loading}>
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Изменить пароль'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
