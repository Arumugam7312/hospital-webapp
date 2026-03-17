import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  User, Mail, Phone, MapPin, Shield, Camera, Bell, Lock, Loader2, 
  Edit2, Calendar, Award, Star, CheckCircle2, Globe, Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    appointments: true,
    marketing: false
  });

  const handlePasswordChange = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      return showToast('All password fields are required', 'error');
    }
    if (passwordData.new !== passwordData.confirm) {
      return showToast('New passwords do not match', 'error');
    }
    if (passwordData.new.length < 6) {
      return showToast('Password must be at least 6 characters', 'error');
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id,
          currentPassword: passwordData.current,
          newPassword: passwordData.new
        })
      });

      if (res.ok) {
        showToast('Password updated successfully', 'success');
        setPasswordData({ current: '', new: '', confirm: '' });
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update password', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (user?.role !== 'doctor') return;
    setIsUpdatingAvailability(true);
    try {
      const newStatus = user.is_available ? 0 : 1;
      const res = await fetch(`/api/doctors/${user.id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: newStatus })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        showToast(`You are now ${newStatus ? 'Available' : 'Unavailable'}`, 'success');
      } else {
        showToast('Failed to update availability', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setIsUpdatingAvailability(false);
    }
  };
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.avatar || '',
    specialization: user?.specialization || '',
    experience: user?.experience || 0,
    age: user?.age || '',
    gender: user?.gender || ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || '',
        specialization: user.specialization || '',
        experience: user.experience || 0,
        age: user.age || '',
        gender: user.gender || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    // Basic Validation
    if (!formData.name.trim()) return showToast('Name is required', 'error');
    if (!formData.email.trim()) return showToast('Email is required', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return showToast('Invalid email format', 'error');

    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id,
          ...formData
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        showToast('Profile updated successfully', 'success');
        setIsEditModalOpen(false);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const InfoSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon size={18} />
        </div>
        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );

  const InfoItem = ({ label, value, icon: Icon }: { label: string, value: string | number | undefined, icon?: any }) => (
    <div className="space-y-1">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
        {Icon && <Icon size={14} className="text-slate-400" />}
        <span>{value || 'Not specified'}</span>
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your personal information, security, and notifications.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="relative mb-24 md:mb-16">
                <div className="h-48 md:h-64 rounded-3xl bg-linear-to-r from-primary to-indigo-600 overflow-hidden shadow-2xl shadow-primary/20 relative">
                  <div className="absolute inset-0 bg-black/10" />
                  
                  {/* Action Buttons - Top right on mobile, bottom right on desktop */}
                  <div className="absolute top-4 mb-20 right-4 md:top-auto md:bottom-6 md:right-8 flex flex-col sm:flex-row gap-2 md:gap-3 z-20">
                    {user?.role === 'doctor' && (
                      <Button 
                        onClick={handleToggleAvailability}
                        disabled={isUpdatingAvailability}
                        className={cn(
                          "backdrop-blur-md border transition-all duration-300 h-9 md:h-11 px-3 md:px-4 text-[10px] md:text-sm",
                          user.is_available 
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30" 
                            : "bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30"
                        )}
                      >
                        {isUpdatingAvailability ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "size-2 rounded-full animate-pulse",
                              user.is_available ? "bg-emerald-400" : "bg-rose-400"
                            )} />
                            {user.is_available ? 'Available' : 'Unavailable'}
                          </div>
                        )}
                      </Button>
                    )}
                    <Button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 h-9 md:h-11 px-3 md:px-4 text-[10px] md:text-sm"
                    >
                      <Edit2 size={16} className="mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>

                {/* Profile Info - Overlapping */}
                <div className="absolute -bottom-20 md:-bottom-12 left-0 right-0 md:left-8 md:right-auto flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 px-4 md:px-0">
                  <div className="relative group">
                    <img 
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=0D9488&color=fff`} 
                      alt={user?.name}
                      className="size-32 md:size-40 rounded-3xl object-cover border-4 md:border-8 border-white dark:border-slate-900 shadow-2xl shadow-black/20"
                    />
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="absolute -bottom-2 -right-2 size-10 rounded-2xl bg-white dark:bg-slate-800 text-primary flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                  <div className="pb-0 md:pb-14 text-center md:text-left space-y-1">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <h1 className="text-2xl md:text-4xl font-black text-slate-900 md:text-white drop-shadow-none md:drop-shadow-md">{user?.name}</h1>
                      {user?.role === 'doctor' && <CheckCircle2 className="text-primary md:text-white fill-primary/10 md:fill-white/20" size={24} />}
                    </div>
                    <p className="text-slate-500 md:text-white/80 font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center md:justify-start gap-2">
                      <Shield size={12} />
                      {user?.role} Account
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-24 md:mt-16">
                {/* Left Column - Quick Stats/Info */}
                <div className="space-y-6">
                  <Card className="p-6 space-y-6">
                    <div className="text-center space-y-2">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Member Since</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white">January 2026</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                        <p className="text-sm font-black text-emerald-500">Active</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified</p>
                        <p className="text-sm font-black text-primary">Yes</p>
                      </div>
                    </div>
                  </Card>

                  {user?.role === 'doctor' && (
                    <Card className="p-6 space-y-4">
                      <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Professional Stats</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
                              <Star size={16} />
                            </div>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Rating</span>
                          </div>
                          <span className="text-sm font-black text-slate-900 dark:text-white">{user.rating || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                              <Award size={16} />
                            </div>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Experience</span>
                          </div>
                          <span className="text-sm font-black text-slate-900 dark:text-white">{user.experience || 0} Years</span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Right Column - Detailed Info */}
                <div className="lg:col-span-2 space-y-8">
                  <Card className="p-8 space-y-10">
                    <InfoSection title="Personal Details" icon={User}>
                      <InfoItem label="Full Name" value={user?.name} icon={User} />
                      <InfoItem label="Email Address" value={user?.email} icon={Mail} />
                      <InfoItem label="Age" value={user?.age} icon={Calendar} />
                      <InfoItem label="Gender" value={user?.gender} icon={User} />
                    </InfoSection>

                    <InfoSection title="Contact Information" icon={Phone}>
                      <InfoItem label="Phone Number" value={user?.phone} icon={Phone} />
                      <InfoItem label="Location" value={user?.address} icon={MapPin} />
                    </InfoSection>

                    {user?.role === 'doctor' && (
                      <InfoSection title="Professional Info" icon={Briefcase}>
                        <InfoItem label="Specialization" value={user?.specialization} icon={Award} />
                        <InfoItem label="Experience" value={`${user?.experience} Years`} icon={Briefcase} />
                      </InfoSection>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card title="Security Settings">
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="flex gap-4">
                      <div className="size-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                        <Lock size={24} />
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                      </div>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Shield size={18} />
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Change Password</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                        <input 
                          type="password" 
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                          placeholder="Enter current password" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary transition-all" 
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                          <input 
                            type="password" 
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                            placeholder="Min. 6 characters" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                          <input 
                            type="password" 
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            placeholder="Repeat new password" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary transition-all" 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handlePasswordChange} disabled={isUpdatingPassword}>
                        {isUpdatingPassword && <Loader2 className="mr-2 animate-spin" size={16} />}
                        Update Password
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Active Sessions" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Globe size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Chrome on Windows</p>
                        <p className="text-xs text-slate-500">New York, USA • Active Now</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-emerald-500">Current</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card title="Notification Preferences" className="p-8">
              <div className="space-y-8">
                <p className="text-sm text-slate-500">Choose how you want to be notified about appointments and updates.</p>
                
                <div className="space-y-6">
                  {[
                    { id: 'email', label: 'Email Notifications', desc: 'Receive updates via your registered email address.' },
                    { id: 'sms', label: 'SMS Notifications', desc: 'Get text messages for urgent appointment changes.' },
                    { id: 'appointments', label: 'Appointment Reminders', desc: 'Automated reminders 24 hours before your visit.' },
                    { id: 'marketing', label: 'Marketing & News', desc: 'Stay updated with hospital news and health tips.' },
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{pref.label}</p>
                        <p className="text-xs text-slate-500">{pref.desc}</p>
                      </div>
                      <button 
                        onClick={() => setNotifications(prev => ({ ...prev, [pref.id]: !(prev as any)[pref.id] }))}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          (notifications as any)[pref.id] ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 size-4 rounded-full bg-white transition-all",
                          (notifications as any)[pref.id] ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button onClick={() => showToast('Notification preferences saved', 'success')}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Profile"
        className="max-w-3xl"
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="City, Country"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            {user?.role === 'doctor' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specialization</label>
                  <input 
                    type="text" 
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience (Years)</label>
                  <input 
                    type="number" 
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Picture</label>
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                <div className="size-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0">
                  <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 w-full space-y-3">
                  <input 
                    type="text" 
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="Image URL" 
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary" 
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, avatar: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <Button variant="outline" size="sm" className="w-full">
                      <Camera size={14} className="mr-2" />
                      Upload from Computer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 animate-spin" size={16} />}
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
