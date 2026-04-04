import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, TrendingUp, Wallet, Search, FileText, Settings, HelpCircle, LogOut, MessageSquare, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { appRoutes } from '@/lib/appRoutes';

const sidebarItems = [
  { label: 'Dashboard', to: appRoutes.learnerDashboard, icon: LayoutDashboard },
  { label: 'My Sessions', to: appRoutes.learnerSessions, icon: Calendar },
  { label: 'Progress Tracker', to: appRoutes.learnerProgress, icon: TrendingUp },
  { label: 'My Wallet', to: appRoutes.learnerWallet, icon: Wallet },
  { label: 'Messages', to: appRoutes.chat, icon: MessageSquare },
  { label: 'Find Mentors', to: appRoutes.mentors, icon: Search },
  { label: 'Post Requirement', to: appRoutes.learnerPostRequirement, icon: FileText },
  { label: 'Settings', to: appRoutes.settings, icon: Settings },
  { label: 'Help & Support', to: appRoutes.help, icon: HelpCircle },
];

const LearnerLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('') || 'L';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card shrink-0">
        <div className="p-6 border-b">
          <Link to="/" className="text-lg font-bold">
            Windows<span className="text-accent">Learning</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t space-y-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden border-b bg-card px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border bg-background"
            aria-label="Open learner menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="text-lg font-bold safe-wrap">Windows<span className="text-accent">Learning</span></Link>
          <div className="flex items-center gap-3">
            <Link to={appRoutes.settings} className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              {initials}
            </Link>
          </div>
        </header>
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
            <div className="h-full w-[min(88vw,22rem)] bg-card border-r shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <Link to="/" className="text-lg font-bold" onClick={() => setIsMobileMenuOpen(false)}>
                  Windows<span className="text-accent">Learning</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border bg-background"
                  aria-label="Close learner menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {sidebarItems.map(item => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                        active ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t p-4">
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default LearnerLayout;
