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

interface EmailSectionProps {
  profile: {
    email: string;
    is_email_verified: boolean;
  } | null;
  emailData: {
    new_email: string;
    code: string;
  };
  emailDialogOpen: boolean;
  emailCodeSent: boolean;
  loading: boolean;
  onEmailChange: (data: Partial<EmailSectionProps['emailData']>) => void;
  onOpenDialog: () => void;
  onCloseDialog: () => void;
  onRequestChange: () => void;
  onConfirmChange: () => void;
}

export default function EmailSection({
  profile,
  emailData,
  emailDialogOpen,
  emailCodeSent,
  loading,
  onEmailChange,
  onOpenDialog,
  onCloseDialog,
  onRequestChange,
  onConfirmChange
}: EmailSectionProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Mail" size={20} />
            Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{profile?.email}</p>
              {profile?.is_email_verified ? (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <Icon name="CheckCircle" size={12} />
                  Подтвержден
                </p>
              ) : (
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <Icon name="AlertCircle" size={12} />
                  Не подтвержден
                </p>
              )}
            </div>
            <Button
              onClick={onOpenDialog}
              variant="outline"
              size="sm"
            >
              <Icon name="Edit" size={16} className="mr-2" />
              Изменить
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={emailDialogOpen} onOpenChange={onCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменение email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Новый email</Label>
              <Input
                type="email"
                value={emailData.new_email}
                onChange={(e) => onEmailChange({ new_email: e.target.value })}
                disabled={emailCodeSent || loading}
              />
            </div>
            {emailCodeSent && (
              <div className="space-y-2">
                <Label>Код подтверждения</Label>
                <Input
                  value={emailData.code}
                  onChange={(e) => onEmailChange({ code: e.target.value })}
                  placeholder="4 цифры"
                  maxLength={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onCloseDialog}
              disabled={loading}
            >
              Отмена
            </Button>
            {!emailCodeSent ? (
              <Button onClick={onRequestChange} disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Отправить код'
                )}
              </Button>
            ) : (
              <Button onClick={onConfirmChange} disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  'Подтвердить'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
