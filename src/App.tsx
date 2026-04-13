import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navigation } from '@/components/Navigation';
import { Login } from '@/components/Login';
import { Signup } from '@/components/Signup';
import { PrivacyPolicy } from '@/components/PrivacyPolicy';
import { Dashboard } from '@/components/Dashboard';
import { UserList } from '@/components/UserList';
import { FundManagement } from '@/components/FundManagement';
import { Messages } from '@/components/Messages';
import { Polls } from '@/components/Polls';
import { Posts } from '@/components/Posts';
import { Profile } from '@/components/Profile';
import { AdminPanel } from '@/components/AdminPanel';
import { Loader2 } from 'lucide-react';

type ViewType = 'login' | 'signup' | 'privacy' | 'dashboard' | 'users' | 'fund' | 'messages' | 'polls' | 'posts' | 'profile' | 'admin';

function AppContent() {
  const { userData, isLoading } = useAuth();
  const { config, loading: configLoading } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<ViewType>('dashboard');
  const [view, setView] = useState<ViewType>('login');

  // Update document title based on site config
  useEffect(() => {
    if (config?.siteTitle) {
      document.title = config.siteTitle;
    }
  }, [config]);

  if (isLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login/signup/privacy
  if (!userData) {
    switch (view) {
      case 'signup':
        return (
          <Signup 
            onSwitchToLogin={() => setView('login')} 
            onPrivacyPolicy={() => setView('privacy')}
          />
        );
      case 'privacy':
        return (
          <PrivacyPolicy 
            onBack={() => setView('signup')} 
          />
        );
      default:
        return (
          <Login 
            onSwitchToSignup={() => setView('signup')} 
            onAdminLogin={() => {}}
          />
        );
    }
  }

  // User is blocked
  if (userData.isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">অ্যাকাউন্ট ব্লক করা হয়েছে</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            আপনার অ্যাকাউন্ট ব্লক করা হয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            লগআউট করুন
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserList />;
      case 'fund':
        return <FundManagement />;
      case 'messages':
        return <Messages />;
      case 'polls':
        return <Polls />;
      case 'posts':
        return <Posts />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return userData.isAdmin ? <AdminPanel /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as ViewType)} />
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
