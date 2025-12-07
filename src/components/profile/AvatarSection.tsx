import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface AvatarSectionProps {
  profile: {
    avatar_url?: string;
    first_name: string;
    last_name: string;
  } | null;
  loading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
}

export default function AvatarSection({ profile, loading, onUpload, onDelete }: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="User" size={20} />
          Аватар
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="text-2xl">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            variant="outline"
          >
            <Icon name="Upload" size={16} className="mr-2" />
            Загрузить
          </Button>
          {profile?.avatar_url && (
            <Button
              onClick={onDelete}
              disabled={loading}
              variant="outline"
            >
              <Icon name="Trash2" size={16} className="mr-2" />
              Удалить
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
