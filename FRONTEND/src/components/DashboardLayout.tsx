import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';
import { 
  Heart, 
  Calendar, 
  FileText, 
  ShoppingBag, 
  Activity, 
  Users, 
  LogOut,
  LayoutDashboard,
  Settings,
  MessageSquare
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { items } = useCart();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const commonItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ];

    if (user?.role === 'patient') {
      return [
        ...commonItems,
        { icon: Calendar, label: 'Appointments', path: '/appointments' },
        { icon: FileText, label: 'Prescriptions', path: '/prescriptions' },
        { icon: Activity, label: 'Health Records', path: '/health-records' },
        { icon: ShoppingBag, label: 'Pharmacy', path: '/pharmacy' },
        { icon: ShoppingBag, label: 'Orders', path: '/orders' },
        { icon: Users, label: 'Find Doctors', path: '/doctors' },
      ];
    }

    if (user?.role === 'doctor') {
      return [
        ...commonItems,
        { icon: Calendar, label: 'Appointments', path: '/appointments' },
        { icon: FileText, label: 'Prescriptions', path: '/prescriptions' },
        { icon: Activity, label: 'Health Records', path: '/health-records' },
        { icon: Users, label: 'Patients', path: '/patients' },
      ];
    }

    if (user?.role === 'admin') {
      return [
        ...commonItems,
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
        { icon: ShoppingBag, label: 'Pharmacy', path: '/admin/pharmacy' },
        { icon: Calendar, label: 'Appointments', path: '/admin/appointments' },
        { icon: Activity, label: 'Analytics', path: '/admin/analytics' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
        { icon: MessageSquare, label: 'Assistants', path: '/admin/assistants' },
       
      ];
    }

    

    return commonItems;
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card shadow-soft">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              PRANIKOV UPHILL
            </span>
          </Link>

          <nav className="space-y-2">
            {getNavItems().map((item) => (
              <Link key={item.path} to={item.path}>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-64 p-6 border-t">
          <div className="mb-4">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="w-full border-b bg-background">
          <div className="container mx-auto p-4 flex items-center justify-end gap-4">
            <div className="flex items-center gap-3">
              <Switch
                aria-label="Toggle theme"
                checked={theme === 'dark'}
                onCheckedChange={() => toggle()}
              />

              <button onClick={() => navigate('/cart')} className="relative">
                <ShoppingCart className="h-5 w-5" />
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full px-1 text-xs">{items.length}</span>
                )}
              </button>
            </div>

            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>{(user?.name || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => navigate('/profile')}>Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => { logout(); navigate('/login'); }}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  );
};
