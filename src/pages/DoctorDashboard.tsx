import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Search,
  PlusCircle,
  Stethoscope,
  TrendingUp,
  Trash2,
  Plus,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

export function DoctorDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [localSchedule, setLocalSchedule] = useState<any[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [medicalData, setMedicalData] = useState({ diagnosis: '', prescription: '' });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchSchedule = () => {
    fetch(`/api/doctors/schedule/${user?.id}`)
      .then(res => res.json())
      .then(data => setSchedule(data));
  };

  useEffect(() => {
    fetch(`/api/appointments?userId=${user?.id}&role=doctor`)
      .then(res => res.json())
      .then(data => setAppointments(data));
    fetchSchedule();
  }, [user]);

  useEffect(() => {
    if (showScheduleModal) {
      setLocalSchedule(JSON.parse(JSON.stringify(schedule)));
    }
  }, [showScheduleModal, schedule]);

  const handleSaveAllSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      // We need to update each day that changed. 
      // For simplicity, we'll just update all days that are in localSchedule.
      const daysToUpdate = days;
      
      for (const day of daysToUpdate) {
        const daySlots = localSchedule.filter(s => s.day_of_week === day);
        await fetch('/api/doctors/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctor_id: user?.id,
            day_of_week: day,
            slots: daySlots
          })
        });
      }
      
      showToast('Weekly schedule updated successfully', 'success');
      fetchSchedule();
      setShowScheduleModal(false);
    } catch (err) {
      showToast('Failed to save schedule', 'error');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const updateLocalDaySlots = (day: string, newSlots: any[]) => {
    setLocalSchedule(prev => {
      const filtered = prev.filter(s => s.day_of_week !== day);
      return [...filtered, ...newSlots.map(s => ({ ...s, day_of_week: day }))];
    });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('new_appointment', (newAppt: any) => {
      setAppointments(prev => [newAppt, ...prev]);
    });

    return () => {
      socket.off('new_appointment');
    };
  }, [socket]);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Appointment ${status}`, 'success');
        setAppointments(prev => prev.map(appt => 
          appt.id === id ? { ...appt, status } : appt
        ));
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
      console.error(err);
    }
  };

  const handleSaveMedicalRecords = async () => {
    if (!selectedAppointment) return;
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}/medical`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicalData)
      });
      if (res.ok) {
        showToast('Medical records updated', 'success');
        handleStatusUpdate(selectedAppointment.id, 'completed');
        setSelectedAppointment(null);
        setMedicalData({ diagnosis: '', prescription: '' });
      } else {
        showToast('Failed to save records', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
      console.error(err);
    }
  };

  const stats = [
    { label: "Today's Appointments", value: '18', sub: '4 remaining', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Patients', value: '1,240', sub: '+12 this week', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Upcoming Slots', value: '6', sub: 'Next: 02:00 PM', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Welcome, {user?.name}</h1>
          <p className="text-slate-500 dark:text-slate-400">You have 18 appointments scheduled for today. 4 are priority cases.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowScheduleModal(true)}>Manage Schedule</Button>
          <Button>
            <PlusCircle className="mr-2" size={18} />
            Add Patient
          </Button>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl p-4 md:p-8 space-y-6 my-8" title="Manage Weekly Schedule" description="Set specific time slots or block off days entirely.">
            <div className="space-y-4">
              {days.map((day) => {
                const daySlots = localSchedule.filter(s => s.day_of_week === day);
                const isBlocked = daySlots.length === 0 || daySlots.every(s => !s.is_available);
                
                return (
                  <div key={day} className="space-y-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">{day}</div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            !isBlocked ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                          )}>
                            <input 
                              type="checkbox" 
                              className="sr-only"
                              checked={!isBlocked}
                              onChange={(e) => {
                                if (!e.target.checked) {
                                  updateLocalDaySlots(day, []);
                                } else if (daySlots.length === 0) {
                                  updateLocalDaySlots(day, [{ start_time: '09:00', end_time: '17:00', is_available: 1 }]);
                                }
                              }}
                            />
                            <div className={cn(
                              "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform",
                              !isBlocked ? "translate-x-5" : "translate-x-0"
                            )} />
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {!isBlocked ? 'Available' : 'Unavailable'}
                          </span>
                        </label>
                        {!isBlocked && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-[10px]"
                            onClick={() => {
                              const newSlots = [...daySlots, { start_time: '09:00', end_time: '17:00', is_available: 1 }];
                              updateLocalDaySlots(day, newSlots);
                            }}
                          >
                            <Plus size={14} className="mr-1" /> Add Slot
                          </Button>
                        )}
                      </div>
                    </div>

                    {!isBlocked && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {daySlots.map((slot, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-1">
                            <div className="flex-1 flex items-center gap-2">
                              <input 
                                type="time" 
                                className="w-full bg-transparent text-xs outline-none focus:text-primary"
                                value={slot.start_time}
                                onChange={(e) => {
                                  const newSlots = [...daySlots];
                                  newSlots[idx].start_time = e.target.value;
                                  updateLocalDaySlots(day, newSlots);
                                }}
                              />
                              <span className="text-slate-400 text-[10px] uppercase font-bold">to</span>
                              <input 
                                type="time" 
                                className="w-full bg-transparent text-xs outline-none focus:text-primary"
                                value={slot.end_time}
                                onChange={(e) => {
                                  const newSlots = [...daySlots];
                                  newSlots[idx].end_time = e.target.value;
                                  updateLocalDaySlots(day, newSlots);
                                }}
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const newSlots = daySlots.filter((_, i) => i !== idx);
                                updateLocalDaySlots(day, newSlots);
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {isBlocked && (
                      <p className="text-[10px] font-bold text-slate-400 italic">Day marked as fully unavailable</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
              <Button onClick={handleSaveAllSchedule} disabled={isSavingSchedule}>
                {isSavingSchedule ? 'Saving...' : 'Save Weekly Schedule'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Medical Records Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-8 space-y-6" title="Complete Appointment" description={`Enter medical details for ${selectedAppointment.patient_name}`}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnosis</label>
                <textarea 
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                  placeholder="Enter patient diagnosis..."
                  value={medicalData.diagnosis}
                  onChange={(e) => setMedicalData({ ...medicalData, diagnosis: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prescription</label>
                <textarea 
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                  placeholder="Enter prescribed medications..."
                  value={medicalData.prescription}
                  onChange={(e) => setMedicalData({ ...medicalData, prescription: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedAppointment(null)}>Cancel</Button>
              <Button onClick={handleSaveMedicalRecords}>Save & Complete</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-start justify-between">
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
        <Card 
          className="lg:col-span-2 p-0" 
          title="Today's Appointments" 
          headerAction={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Search patient..." className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none" />
              </div>
              <Button variant="ghost" size="sm">Filter</Button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <img src={`https://i.pravatar.cc/150?u=${appt.patient_name}`} alt="" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{appt.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{appt.time}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                        {appt.type || 'Consultation'}
                      </span>
                    </td>
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
                          <>
                            <Button 
                              size="sm" 
                              variant="primary" 
                              className="h-8 px-2 bg-green-600 hover:bg-green-700"
                              onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button 
                              size="sm" 
                              variant="danger" 
                              className="h-8 px-2"
                              onClick={() => handleStatusUpdate(appt.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {appt.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 px-2"
                            onClick={() => setSelectedAppointment(appt)}
                          >
                            Complete
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-2"
                          onClick={() => showToast('Medical records view coming soon', 'info')}
                        >
                          View Records
                        </Button>
                        <button className="text-slate-400 hover:text-primary transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Monthly Schedule" headerAction={<Button variant="ghost" size="sm">Oct 2023</Button>}>
            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={`day-${i}`} className="text-[10px] font-bold text-slate-400 uppercase">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }).map((_, i) => (
                <button 
                  key={i} 
                  className={cn(
                    "aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all",
                    i + 1 === 24 ? "bg-primary text-white shadow-lg shadow-primary/20" :
                    [12, 15, 18, 20].includes(i + 1) ? "bg-primary/10 text-primary" :
                    "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="size-2 rounded-full bg-primary" /> Upcoming Event
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-black text-slate-900 dark:text-white">Medical Conference</p>
                <p className="text-[10px] text-slate-500 mt-1">Oct 28, 09:00 AM - 05:00 PM</p>
              </div>
            </div>
          </Card>

          <Card title="Priority Patients" headerAction={<AlertCircle size={18} className="text-orange-500" />}>
            <div className="space-y-4">
              {[
                { name: 'Robert Fox', condition: 'Post-Surgery Checkup', time: '10:30 AM', color: 'bg-orange-500' },
                { name: 'Jane Cooper', condition: 'Chronic Hypertension', time: '11:45 AM', color: 'bg-red-500' },
                { name: 'Cody Fisher', condition: 'Severe Migraine', time: '02:15 PM', color: 'bg-orange-500' },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group">
                  <div className={cn("w-1 h-8 rounded-full", p.color)} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{p.condition}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 dark:text-white">{p.time}</p>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors ml-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
