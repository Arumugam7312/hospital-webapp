import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  Stethoscope, 
  ShieldCheck, 
  Users, 
  Clock, 
  ArrowRight, 
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Heart,
  Activity,
  Award,
  Star,
  Menu,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-20 border-b border-slate-100 dark:border-slate-900 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Stethoscope size={24} />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">MedSync</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-400">
          <a href="#services" className="hover:text-primary transition-colors">Services</a>
          <Link to="/doctors" className="hover:text-primary transition-colors">Specialists</Link>
          <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-bold">Login</Button>
            </Link>
            <Link to="/login">
              <Button className="rounded-xl px-6">Book Now</Button>
            </Link>
          </div>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-20 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 z-40 lg:hidden p-6 space-y-4 shadow-xl"
          >
            <div className="flex flex-col gap-4">
              <a href="#services" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-600 dark:text-slate-400">Services</a>
              <Link to="/doctors" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-600 dark:text-slate-400">Specialists</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-600 dark:text-slate-400">About Us</Link>
              <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-600 dark:text-slate-400">Contact</Link>
              <div className="pt-4 flex flex-col gap-3">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full py-6">Login</Button>
                </Link>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full py-6">Book Appointment</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-8 md:px-20 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
              <ShieldCheck size={14} />
              Trusted by 50,000+ Patients
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Your Health, <br />
              <span className="text-primary">Our Priority.</span>
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
              Experience world-class healthcare with MedSync. Book appointments with top specialists, manage your medical records, and get expert care from the comfort of your home.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/login">
                <Button size="lg" className="rounded-2xl px-8 py-6 text-lg shadow-2xl shadow-primary/30">
                  Book Appointment
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="rounded-2xl px-8 py-6 text-lg">
                View Services
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                  </div>
                ))}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white dark:border-slate-950 bg-primary flex items-center justify-center text-white text-[10px] md:text-xs font-bold">
                  +2k
                </div>
              </div>
              <div>
                <div className="flex text-yellow-400 mb-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-current" />)}
                </div>
                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">4.9/5 Patient Satisfaction</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl shadow-slate-900/20 border-8 border-white dark:border-slate-900">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070" 
                alt="Doctor" 
                className="w-full aspect-[4/5] object-cover"
              />
            </div>
            {/* Floating Cards */}
            <div className="absolute -left-12 top-1/4 z-20 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-bounce-slow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Heart Rate</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">72 BPM</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-12 bottom-1/4 z-20 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-bounce-slow delay-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specialists</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">500+</p>
                </div>
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-3xl"></div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-8 md:px-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-sm font-black text-primary uppercase tracking-[0.2em]">Our Specializations</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Comprehensive Care for Every Patient</h3>
            <p className="text-slate-500 dark:text-slate-400">We offer a wide range of specialized medical services delivered by board-certified experts using state-of-the-art technology.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Cardiology', desc: 'Heart health management and advanced diagnostics.', icon: Heart, color: 'bg-red-500' },
              { title: 'Neurology', desc: 'Expert care for brain and nervous system disorders.', icon: Activity, color: 'bg-indigo-500' },
              { title: 'Pediatrics', desc: 'Compassionate healthcare for infants, children, and teens.', icon: Award, color: 'bg-emerald-500' },
              { title: 'Orthopedics', desc: 'Specialized treatment for bone and joint conditions.', icon: Stethoscope, color: 'bg-blue-500' },
            ].map((service) => (
              <Card key={service.title} className="group hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", service.color)}>
                  <service.icon size={28} />
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3">{service.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{service.desc}</p>
                <button className="text-primary font-bold text-sm flex items-center gap-2 group-hover:gap-4 transition-all">
                  Learn More <ArrowRight size={16} />
                </button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20 px-8 md:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
                <Stethoscope size={24} />
              </div>
              <span className="text-xl font-black tracking-tight">MedSync</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Leading the way in medical excellence and patient-centered care. Your health is our mission.
            </p>
            <div className="flex gap-4">
              {/* Social Icons */}
            </div>
          </div>
          
          <div>
            <h5 className="font-black uppercase tracking-widest text-xs mb-8 text-slate-500">Quick Links</h5>
            <ul className="space-y-4 text-sm font-bold text-slate-400">
              <li><Link to="/doctors" className="hover:text-white transition-colors">Find a Doctor</Link></li>
              <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-black uppercase tracking-widest text-xs mb-8 text-slate-500">Contact Us</h5>
            <ul className="space-y-4 text-sm font-bold text-slate-400">
              <li className="flex items-center gap-3"><MapPin size={18} className="text-primary" /> 123 Health Ave, Medical City</li>
              <li className="flex items-center gap-3"><Phone size={18} className="text-primary" /> +1 (555) 000-1234</li>
              <li className="flex items-center gap-3"><Mail size={18} className="text-primary" /> support@medsync.com</li>
            </ul>
          </div>

          <div>
            <h5 className="font-black uppercase tracking-widest text-xs mb-8 text-slate-500">Newsletter</h5>
            <p className="text-slate-400 text-sm mb-6">Subscribe for health tips and hospital updates.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-slate-800 border-none rounded-lg px-4 py-2 text-sm w-full focus:ring-2 focus:ring-primary" />
              <Button size="sm">Join</Button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-800 flex flex-wrap justify-between gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          <p>© 2023 MedSync Healthcare. All Rights Reserved.</p>
          <div className="flex gap-8">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
