import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  History, 
  CreditCard, 
  Users, 
  Settings, 
  LogOut,
  Stethoscope,
  BarChart3,
  Search,
  FileText,
  Phone,
  Activity,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const patientLinks = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Doctors', icon: Stethoscope, path: '/doctors' },
    { label: 'Medical Records', icon: Activity, path: '/medical-records' },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  const doctorLinks = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Schedule', icon: Calendar, path: '/doctor/schedule' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  const adminLinks = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Doctors', icon: Stethoscope, path: '/admin/doctors' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  const commonLinks = [
    { label: 'About Us', icon: Users, path: '/about' },
    { label: 'Contact', icon: Phone, path: '/contact' },
  ];

  const links = [
    ...(user?.role === 'patient' ? patientLinks : user?.role === 'doctor' ? doctorLinks : adminLinks),
    ...commonLinks
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-screen w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-50 transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none text-slate-900 dark:text-white">MedSync</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hospital MS</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                location.pathname === link.path
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <img 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`} 
              alt={user?.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
              {user?.role} ID: #{user?.id}
            </p>
          </div>
          <button 
            onClick={logout}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  </>
);
}
