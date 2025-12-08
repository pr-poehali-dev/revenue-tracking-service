import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProjectsTable from './Projects/ProjectsTable';
import ProjectDialog from './Projects/ProjectDialog';
import { Project } from './Projects/types';

const API_URL = 'https://functions.poehali.dev/5741ba68-de8d-41af-bdef-39c18cc09090';
const CLIENTS_API_URL = 'https://functions.poehali.dev/c1ed6936-95c5-4b22-a918-72cc11832898';

interface Client {
  id: number;
  name: string;
}

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const { toast } = useToast();

  const [formData, setFormData] = useState<Project>({
    name: '',
    description: '',
    status: 'active',
    client_id: undefined
  });

  useEffect(() => {
    loadProjects();
    loadClients();
  }, [viewMode]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');

      console.log('Loading projects with:', { userId, companyId });

      if (!userId || !companyId) {
        toast({
          title: 'Ошибка авторизации',
          description: 'Пожалуйста, войдите в систему заново',
          variant: 'destructive'
        });
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      
      const response = await fetch(`${API_URL}?status=${viewMode}`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить проекты',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${CLIENTS_API_URL}?status=active`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.status || 'active',
        client_id: project.client_id
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        status: 'active',
        client_id: undefined
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название проекта обязательно',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const method = editingProject ? 'PUT' : 'POST';
      
      const response = await fetch(API_URL, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: editingProject ? 'Проект обновлён' : 'Проект добавлен'
        });
        handleCloseDialog();
        loadProjects();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось сохранить проект',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (projectId: number) => {
    if (!confirm('Переместить проект в архив?')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const project = projects.find(p => p.id === projectId);
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify({
          id: projectId,
          name: project?.name || '',
          description: project?.description || '',
          client_id: project?.client_id,
          status: 'archived'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Проект перемещён в архив'
        });
        setViewMode('active');
        loadProjects();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось архивировать проект',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${API_URL}?id=${projectId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Проект удалён'
        });
        loadProjects();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить проект',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (projectId: number) => {
    if (!confirm('Вернуть проект в активный статус?')) {
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const project = projects.find(p => p.id === projectId);
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify({
          id: projectId,
          name: project?.name || '',
          description: project?.description || '',
          client_id: project?.client_id,
          status: 'active'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: 'Проект возвращён в активные'
        });
        loadProjects();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось активировать проект',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (projectId: number) => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const response = await fetch(`${API_URL}?id=${projectId}`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId || '',
          'X-Company-Id': companyId || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        handleOpenDialog(data);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить данные проекта',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связаться с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Проекты</h2>
            <p className="text-muted-foreground mt-1">Управление проектами компании</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'active' ? 'default' : 'outline'}
              onClick={() => setViewMode('active')}
              disabled={loading}
            >
              Активные
            </Button>
            <Button
              variant={viewMode === 'archived' ? 'default' : 'outline'}
              onClick={() => setViewMode('archived')}
              disabled={loading}
            >
              Архив
            </Button>
            {viewMode === 'active' && (
              <Button onClick={() => handleOpenDialog()} disabled={loading}>
                <Icon name="Plus" size={20} className="mr-2" />
                Добавить проект
              </Button>
            )}
          </div>
        </div>

        <ProjectsTable
          projects={projects}
          loading={loading}
          viewMode={viewMode}
          onViewDetails={handleViewDetails}
          onArchive={handleArchive}
          onActivate={handleActivate}
          onDelete={handleDelete}
        />

        <ProjectDialog
          open={dialogOpen}
          editingProject={editingProject}
          formData={formData}
          loading={loading}
          clients={clients}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onFormDataChange={setFormData}
        />
      </div>
    </DashboardLayout>
  );
}