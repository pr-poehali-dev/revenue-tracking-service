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
import { Project } from './types';

interface ProjectsTableProps {
  projects: Project[];
  loading: boolean;
  viewMode: 'active' | 'archived';
  onViewDetails: (projectId: number) => void;
  onArchive: (projectId: number) => void;
  onActivate: (projectId: number) => void;
  onDelete: (projectId: number) => void;
}

export default function ProjectsTable({
  projects,
  loading,
  viewMode,
  onViewDetails,
  onArchive,
  onActivate,
  onDelete,
}: ProjectsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="FolderKanban" size={20} />
          Список проектов
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Icon name="Loader2" className="animate-spin" size={32} />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="FolderKanban" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Проектов пока нет</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    {project.client_name ? (
                      <span className="text-muted-foreground">{project.client_name}</span>
                    ) : (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.description ? (
                      project.description.length > 50 ? project.description.substring(0, 50) + '...' : project.description
                    ) : (
                      <span className="italic">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.created_at ? new Date(project.created_at).toLocaleDateString('ru-RU') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(project.id!)}
                        title="Просмотр"
                      >
                        <Icon name="Eye" size={16} />
                      </Button>
                      {viewMode === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchive(project.id!)}
                          title="В архив"
                        >
                          <Icon name="Archive" size={16} />
                        </Button>
                      )}
                      {viewMode === 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onActivate(project.id!)}
                          title="Вернуть в активные"
                        >
                          <Icon name="ArchiveRestore" size={16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(project.id!)}
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
