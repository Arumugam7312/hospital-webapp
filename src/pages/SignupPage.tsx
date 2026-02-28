import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Stethoscope, Lock, Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export function SignupPage() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (name.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        const user = await res.json();
        login(user);
        showToast('Account created successfully!', 'success');
        navigate('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl text-white shadow-xl shadow-primary/20 mb-6">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Join MedSync</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Create your patient account to start booking</p>
        </div>

        <Card className="p-8 space-y-6">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <ShieldCheck size={14} className="text-red-500" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <User size={12} />
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Mail size={12} />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Lock size={12} />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary transition-all outline-none"
              />
            </div>

            <Button type="submit" size="lg" className="w-full py-4 rounded-xl" isLoading={isLoading}>
              Create Account
              <ArrowRight className="ml-2" size={18} />
            </Button>

            <p className="text-center text-xs font-bold text-slate-500">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Login here</Link>
            </p>
          </form>
        </Card>

        <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            HIPAA Compliant
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            Secure Data
          </div>
        </div>
      </div>
    </div>
  );
}
