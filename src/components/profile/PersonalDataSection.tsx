import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface PersonalDataSectionProps {
  profile: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    phone?: string;
  } | null;
  formData: {
    first_name: string;
    last_name: string;
    middle_name: string;
    phone: string;
  };
  editMode: boolean;
  loading: boolean;
  onFormChange: (data: Partial<PersonalDataSectionProps['formData']>) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function PersonalDataSection({
  profile,
  formData,
  editMode,
  loading,
  onFormChange,
  onEdit,
  onSave,
  onCancel
}: PersonalDataSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Icon name="UserCircle" size={20} />
          Персональные данные
        </CardTitle>
        {!editMode && (
          <Button onClick={onEdit} variant="outline" size="sm">
            <Icon name="Edit" size={16} className="mr-2" />
            Редактировать
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Фамилия *</Label>
            {editMode ? (
              <Input
                value={formData.last_name}
                onChange={(e) => onFormChange({ last_name: e.target.value })}
                disabled={loading}
              />
            ) : (
              <p className="text-sm font-medium">{profile?.last_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Имя *</Label>
            {editMode ? (
              <Input
                value={formData.first_name}
                onChange={(e) => onFormChange({ first_name: e.target.value })}
                disabled={loading}
              />
            ) : (
              <p className="text-sm font-medium">{profile?.first_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Отчество</Label>
            {editMode ? (
              <Input
                value={formData.middle_name}
                onChange={(e) => onFormChange({ middle_name: e.target.value })}
                disabled={loading}
              />
            ) : (
              <p className="text-sm font-medium">{profile?.middle_name || '—'}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Телефон</Label>
            {editMode ? (
              <Input
                value={formData.phone}
                onChange={(e) => onFormChange({ phone: e.target.value })}
                disabled={loading}
                placeholder="+7 (999) 123-45-67"
              />
            ) : (
              <p className="text-sm font-medium">{profile?.phone || '—'}</p>
            )}
          </div>
        </div>
        {editMode && (
          <div className="flex gap-2 mt-4">
            <Button onClick={onSave} disabled={loading}>
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={loading}
            >
              Отмена
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
