import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  History, 
  Stethoscope, 
  Download, 
  PlusCircle,
  MoreVertical,
  CheckCircle2,
  Clock,
  ChevronRight,
  XCircle,
  FileText,
  Pill,
  Star,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { Modal } from '../components/ui/Modal';

export function PatientDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedPastAppt, setSelectedPastAppt] = useState<any>(null);
  const [feedbackApptId, setFeedbackApptId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedbackApptId) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/appointments/${feedbackApptId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });
      if (res.ok) {
        showToast('Feedback submitted. Thank you!', 'success');
        setAppointments(prev => prev.map(appt => 
          appt.id === feedbackApptId ? { ...appt, rating, comment } : appt
        ));
        setFeedbackApptId(null);
        setRating(5);
        setComment('');
      } else {
        showToast('Failed to submit feedback', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    fetch(`/api/appointments?userId=${user?.id}&role=patient`)
      .then(res => res.json())
      .then(data => setAppointments(data));
  }, [user]);

  const handleCancel = async () => {
    if (!cancellingId) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${cancellingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        showToast('Appointment cancelled', 'success');
        setAppointments(prev => prev.map(appt => 
          appt.id === cancellingId ? { ...appt, status: 'cancelled' } : appt
        ));
      } else {
        showToast('Failed to cancel appointment', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
      console.error(err);
    } finally {
      setIsCancelling(false);
      setCancellingId(null);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('appointment_updated', (updatedAppt: any) => {
      setAppointments(prev => prev.map(appt => 
        appt.id === updatedAppt.id ? { ...appt, status: updatedAppt.status, diagnosis: updatedAppt.diagnosis, prescription: updatedAppt.prescription } : appt
      ));
    });

    return () => {
      socket.off('appointment_updated');
    };
  }, [socket]);

  const upcomingAppointments = appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
  const pastAppointments = appointments.filter(a => a.status === 'completed');
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const totalCompletedOrCancelled = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').length;
  const successRate = totalCompletedOrCancelled > 0 
    ? Math.round((appointments.filter(a => a.status === 'completed').length / totalCompletedOrCancelled) * 100) 
    : 100;

  const stats = [
    { label: 'Upcoming Visit', value: upcomingAppointments[0]?.date || 'None', sub: upcomingAppointments[0]?.doctor_name || 'No scheduled visits', icon: CalendarIcon, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Booking Success', value: `${successRate}%`, sub: 'Completion Rate', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Cancelled', value: cancelledAppointments.length.toString(), sub: 'Total Cancelled', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const [activeTab, setActiveTab] = useState<'active' | 'cancelled'>('active');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Welcome back, {user?.name.split(' ')[0]}</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Here is a quick overview of your health activities and appointments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
              <p className={cn("text-sm font-medium mt-2 flex items-center gap-1", stat.color)}>
                {stat.sub}
              </p>
            </div>
            <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-0 overflow-hidden">
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setActiveTab('active')}
                className={cn(
                  "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === 'active' ? "text-primary border-b-2 border-primary bg-primary/5" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Active Bookings ({upcomingAppointments.length})
              </button>
              <button 
                onClick={() => setActiveTab('cancelled')}
                className={cn(
                  "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === 'cancelled' ? "text-red-500 border-b-2 border-red-500 bg-red-500/5" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Cancelled ({cancelledAppointments.length})
              </button>
            </div>

            <div className="overflow-x-auto">
              {activeTab === 'active' ? (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Doctor Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Time</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {upcomingAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                              {appt.doctor_avatar ? (
                                <img src={appt.doctor_avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Stethoscope size={14} />
                              )}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{appt.doctor_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{appt.department}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{appt.date}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{appt.time}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            appt.status === 'confirmed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            appt.status === 'pending' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          )}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {appt.status === 'pending' && (
                              <button 
                                onClick={() => setCancellingId(appt.id)}
                                className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                title="Cancel Appointment"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                            <button className="text-slate-400 hover:text-primary transition-colors">
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {upcomingAppointments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic text-sm">No active appointments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Doctor Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Time</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cancelledAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 overflow-hidden">
                              {appt.doctor_avatar ? (
                                <img src={appt.doctor_avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <XCircle size={14} />
                              )}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{appt.doctor_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{appt.department}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{appt.date}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{appt.time}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {cancelledAppointments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic text-sm">No cancelled appointments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <Card title="Past Appointments & Medical Records" className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pastAppointments.map((appt) => (
                <div key={appt.id} className="p-4 md:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex gap-4">
                      <div className="size-10 md:size-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                        {appt.doctor_avatar ? (
                          <img src={appt.doctor_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <CalendarIcon size={20} className="md:size-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-sm md:text-base text-slate-900 dark:text-white">{appt.doctor_name}</h4>
                        <p className="text-[10px] md:text-xs text-slate-500">{appt.department} • {appt.date}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-[10px] md:text-xs" onClick={() => setSelectedPastAppt(selectedPastAppt?.id === appt.id ? null : appt)}>
                        {selectedPastAppt?.id === appt.id ? 'Hide Details' : 'View Records'}
                      </Button>
                      {!appt.rating && (
                        <Button size="sm" className="flex-1 sm:flex-none text-[10px] md:text-xs" onClick={() => setFeedbackApptId(appt.id)}>
                          <Star size={12} className="mr-1" /> Provide Feedback
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {appt.rating && (
                    <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={cn(i < appt.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-300")} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Feedback</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{appt.comment || 'No comment left.'}"</p>
                    </div>
                  )}
                  
                  {selectedPastAppt?.id === appt.id && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400">
                          <FileText size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Diagnosis</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          {appt.diagnosis || 'No diagnosis recorded for this visit.'}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400">
                          <Pill size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Prescription</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          {appt.prescription || 'No prescription recorded for this visit.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {pastAppointments.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-400 italic text-sm">No past appointments found.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-primary p-8 rounded-2xl text-white relative overflow-hidden group shadow-xl shadow-primary/20">
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-2">Need a new appointment?</h2>
              <p className="text-white/80 mb-6 max-w-xs font-medium">Book a consultation with our world-class specialists in just a few clicks.</p>
              <Link to="/doctors">
                <Button variant="secondary" className="bg-white text-primary hover:bg-slate-100">
                  <PlusCircle className="mr-2" size={18} />
                  Book Appointment
                </Button>
              </Link>
            </div>
            <CalendarIcon className="absolute -bottom-10 -right-10 size-64 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
          </div>

          <Card title="Quick Actions" className="space-y-3">
            <Button variant="outline" className="w-full justify-start text-left h-auto py-4 px-4 rounded-xl">
              <Download className="mr-3 text-primary" size={20} />
              <div>
                <p className="text-sm font-black">Download All Records</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">PDF Format • 2.4 MB</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left h-auto py-4 px-4 rounded-xl">
              <History className="mr-3 text-blue-500" size={20} />
              <div>
                <p className="text-sm font-black">View Billing History</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Last payment: Oct 12</p>
              </div>
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!cancellingId}
        onClose={() => setCancellingId(null)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Yes, Cancel"
        variant="danger"
      />

      <Modal
        isOpen={!!feedbackApptId}
        onClose={() => setFeedbackApptId(null)}
        title="Provide Feedback"
      >
        <div className="space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-500">How was your experience with the doctor?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star 
                    size={32} 
                    className={cn(
                      "transition-colors",
                      star <= rating ? "text-yellow-500 fill-yellow-500" : "text-slate-200 dark:text-slate-800"
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <MessageSquare size={12} />
              Your Comments
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (optional)..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary h-32 resize-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setFeedbackApptId(null)}>Cancel</Button>
            <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback}>
              {isSubmittingFeedback && <Loader2 className="mr-2 animate-spin" size={16} />}
              Submit Feedback
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}



