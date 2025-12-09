import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Landing = () => {
  const features = [
    {
      icon: 'Users',
      title: 'Управление клиентами',
      description: 'Вся информация о клиентах в одном месте. Контакты, история взаимодействий и статусы.'
    },
    {
      icon: 'FolderKanban',
      title: 'Проекты и заказы',
      description: 'Полный контроль над проектами и заказами. Отслеживайте статусы и дедлайны.'
    },
    {
      icon: 'Wallet',
      title: 'Управление платежами',
      description: 'Планируйте платежи, отслеживайте выручку и контролируйте финансовые потоки.'
    },
    {
      icon: 'UsersRound',
      title: 'Команда и сотрудники',
      description: 'Управляйте доступами сотрудников и распределяйте роли в компании.'
    },
    {
      icon: 'BarChart3',
      title: 'Аналитика и отчёты',
      description: 'Наглядная статистика по выручке, проектам и клиентам в реальном времени.'
    },
    {
      icon: 'Shield',
      title: 'Безопасность данных',
      description: 'Защита данных и разграничение прав доступа для каждого сотрудника.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="BarChart3" className="text-primary-foreground" size={24} />
            </div>
            <span className="text-xl font-bold text-foreground">Luma Finance</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Войти</Button>
            </Link>
            <Link to="/register">
              <Button>Начать работу</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Управляйте выручкой
            <span className="text-primary"> эффективно</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Современная система для управления клиентами, проектами, заказами и финансами вашего бизнеса
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8">
                Попробовать бесплатно
                <Icon name="ArrowRight" className="ml-2" size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Всё необходимое для роста вашего бизнеса
          </h2>
          <p className="text-lg text-muted-foreground">
            Инструменты, которые помогут организовать работу и увеличить прибыль
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon name={feature.icon} className="text-primary" size={24} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl border-2 p-8 md:p-12 shadow-xl">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Готовы начать?
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Зарегистрируйтесь бесплатно и получите доступ ко всем возможностям системы
                  </p>
                  <ul className="space-y-3 mb-6">
                    {['Без кредитной карты', 'Настройка за 5 минут', 'Поддержка 24/7'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-foreground">
                        <Icon name="CheckCircle2" className="text-primary" size={20} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register">
                    <Button size="lg" className="text-lg">
                      Создать аккаунт бесплатно
                    </Button>
                  </Link>
                </div>
                <div className="w-full md:w-auto">
                  <div className="w-48 h-48 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Icon name="Rocket" className="text-primary" size={96} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="BarChart3" className="text-primary-foreground" size={18} />
              </div>
              <span className="font-bold text-foreground">Luma Finance</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Revenue Track. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;