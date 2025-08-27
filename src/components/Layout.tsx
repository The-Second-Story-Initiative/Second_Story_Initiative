import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  Home,
  BookOpen,
  Bot,
  FolderOpen,
  Users,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Github,
  Bell,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Learning Paths', href: '/learning', icon: BookOpen },
    { name: 'AI Mentor', href: '/mentor', icon: Bot },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Mentorship', href: '/mentorship', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-secondary-900/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">SSI</span>
              </div>
              <span className="font-semibold text-secondary-900">Second Story</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-secondary-500 hover:text-secondary-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-6 px-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium mb-1 transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-secondary-200">
          <div className="flex h-16 items-center px-6">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">SSI</span>
              </div>
              <span className="font-semibold text-secondary-900">Second Story</span>
            </Link>
          </div>
          <nav className="mt-6 flex-1 px-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium mb-1 transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white border-b border-secondary-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-secondary-500 hover:text-secondary-700 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="text-secondary-500 hover:text-secondary-700 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-error-500 rounded-full"></span>
              </button>
              
              {/* GitHub link */}
              {user?.github_username && (
                <a
                  href={`https://github.com/${user.github_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-500 hover:text-secondary-700"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
              
              {/* User menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-primary-600" />
                    )}
                  </div>
                  <span className="hidden sm:block font-medium text-secondary-900">
                    {user?.full_name}
                  </span>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-medium border border-secondary-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                    >
                      <User className="mr-3 h-4 w-4" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;