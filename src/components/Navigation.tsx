import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  MessageSquare, 
  Vote, 
  Newspaper, 
  UserCircle, 
  LogOut,
  Moon,
  Sun,
  Crown,
  Menu,
  Sparkles
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: 'users', label: 'ইউজার লিস্ট', icon: Users },
  { id: 'fund', label: 'ফান্ড ম্যানেজমেন্ট', icon: Wallet },
  { id: 'messages', label: 'বার্তা', icon: MessageSquare },
  { id: 'polls', label: 'ভোটিং', icon: Vote },
  { id: 'posts', label: 'পোস্টস', icon: Newspaper },
  { id: 'profile', label: 'প্রোফাইল', icon: UserCircle },
];

const adminNavItems = [
  { id: 'admin', label: 'অ্যাডমিন প্যানেল', icon: Crown },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { userData, logout, isAdmin } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { config } = useSiteConfig();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {config?.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">
              {config?.siteName || 'Fund Management'}
            </p>
            <p className="text-xs text-gray-500">{userData?.name}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              <Crown size={10} />
              অ্যাডমিন
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
        
        {isAdmin && (
          <>
            <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              অ্যাডমিন মেনু
            </p>
            {adminNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          {isDarkMode ? 'লাইট মোড' : 'ডার্ক মোড'}
        </Button>
        <Button
          variant="destructive"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          লগআউট
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 shadow-xl">
        <NavContent />
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {config?.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="font-bold text-gray-900 dark:text-white text-sm">{config?.siteName || 'Fund'}</span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
