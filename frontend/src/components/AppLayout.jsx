import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LayoutDashboard, SendHorizonal, History, PlusCircle, LogOut, Wallet, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { to: '/',        label: 'Dashboard', icon: LayoutDashboard },
    { to: '/send',    label: 'Send Money', icon: SendHorizonal },
    { to: '/topup',   label: 'Add Money',  icon: PlusCircle },
    { to: '/history', label: 'History',    icon: History },
  ]
  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin Panel', icon: ShieldAlert })
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r flex-col sticky top-0 h-screen shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">PayFlow</span>
          </div>
        </div>

        <Separator />

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {({ isActive }) => (
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}>
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <Separator />
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-10 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="font-bold text-primary">PayFlow</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 mt-14 md:mt-0 overflow-auto">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-10">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <div className={cn('flex flex-col items-center gap-0.5 p-2', isActive ? 'text-primary' : 'text-muted-foreground')}>
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
