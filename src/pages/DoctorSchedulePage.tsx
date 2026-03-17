import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  parseISO
} from 'date-fns';
import { cn } from '../lib/utils';

export function DoctorSchedulePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [isBlockingModalOpen, setIsBlockingModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blockData, setBlockData] = useState({
    start_time: '09:00',
    end_time: '17:00',
    reason: '',
    isFullDay: false
  });

  const fetchData = async () => {
    try {
      const [apptsRes, blocksRes, scheduleRes] = await Promise.all([
        fetch(`/api/appointments?userId=${user?.id}&role=doctor`),
        fetch(`/api/doctors/blocks/${user?.id}`),
        fetch(`/api/doctors/schedule/${user?.id}`)
      ]);
      
      const appts = await apptsRes.json();
      const blks = await blocksRes.json();
      const sched = await scheduleRes.json();
      
      setAppointments(appts);
      setBlocks(blks);
      setWeeklySchedule(sched);
    } catch (err) {
      showToast('Failed to fetch schedule data', 'error');
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleBlockTime = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/doctors/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: user?.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: blockData.isFullDay ? '00:00' : blockData.start_time,
          end_time: blockData.isFullDay ? '23:59' : blockData.end_time,
          reason: blockData.reason
        })
      });
      
      if (res.ok) {
        showToast('Time slot blocked successfully', 'success');
        setIsBlockingModalOpen(false);
        fetchData();
      } else {
        showToast('Failed to block time slot', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    try {
      const res = await fetch(`/api/doctors/blocks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Block removed', 'success');
        fetchData();
      }
    } catch (err) {
      showToast('Failed to remove block', 'error');
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayStatus = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayBlocks = blocks.filter(b => b.date === dateStr);
    const dayAppts = appointments.filter(a => a.date === dateStr);
    const dayOfWeek = format(day, 'EEEE');
    const isWorkingDay = weeklySchedule.some(s => s.day_of_week === dayOfWeek && s.is_available);
    
    return {
      hasBlocks: dayBlocks.length > 0,
      hasAppointments: dayAppts.length > 0,
      isWorkingDay,
      blocks: dayBlocks,
      appointments: dayAppts
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Schedule Manager</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your availability, appointments, and blocked time.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-black min-w-40 text-center uppercase tracking-widest">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar View */}
        <Card className="lg:col-span-2 p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const status = getDayStatus(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative aspect-square rounded-2xl p-2 flex flex-col items-center justify-center transition-all border-2",
                    !isCurrentMonth ? "opacity-20" : "opacity-100",
                    isSelected 
                      ? "bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-105 z-10" 
                      : cn(
                          "bg-slate-50 dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700",
                          status.hasBlocks && "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20"
                        ),
                    isToday(day) && !isSelected && "border-primary/50 text-primary"
                  )}
                >
                  <span className="text-sm font-black">{format(day, 'd')}</span>
                  <div className="flex gap-1 mt-1">
                    {status.hasAppointments && (
                      <div className={cn("size-1.5 rounded-full", isSelected ? "bg-white" : "bg-primary")} />
                    )}
                    {status.hasBlocks && (
                      <div className={cn("size-1.5 rounded-full", isSelected ? "bg-white/50" : "bg-red-500")} />
                    )}
                  </div>
                  {(!status.isWorkingDay || status.hasBlocks) && isCurrentMonth && (
                    <div className="absolute top-1 right-1">
                      {status.hasBlocks ? (
                        <AlertCircle size={10} className={isSelected ? "text-white/50" : "text-red-500"} />
                      ) : (
                        <Lock size={10} className={isSelected ? "text-white/50" : "text-slate-400"} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Day Details */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Date</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {format(selectedDate, 'EEEE, MMM do')}
                </h3>
              </div>
              <Button size="sm" onClick={() => setIsBlockingModalOpen(true)}>
                <Plus size={16} className="mr-1" /> Block
              </Button>
            </div>

            <div className="space-y-6">
              {/* Appointments */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CalendarIcon size={12} /> Appointments
                </h4>
                {getDayStatus(selectedDate).appointments.length > 0 ? (
                  <div className="space-y-2">
                    {getDayStatus(selectedDate).appointments.map((appt: any) => (
                      <div key={appt.id} className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{appt.patient_name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{appt.time} • {appt.type}</p>
                        </div>
                        <CheckCircle2 size={16} className="text-primary" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No appointments scheduled</p>
                )}
              </div>

              {/* Blocks */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={12} /> Blocked Slots
                </h4>
                {getDayStatus(selectedDate).blocks.length > 0 ? (
                  <div className="space-y-2">
                    {getDayStatus(selectedDate).blocks.map((block: any) => (
                      <div key={block.id} className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-red-600 dark:text-red-400">{block.reason || 'Blocked'}</p>
                          <p className="text-[10px] text-red-500/70 font-medium">{block.start_time} - {block.end_time}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No blocked time slots</p>
                )}
              </div>
            </div>
          </Card>

          {/* Legend */}
          <Card className="p-4 space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legend</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="size-2 rounded-full bg-primary" /> Appointment
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <AlertCircle size={12} className="text-red-500" /> Blocked Slot
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <Lock size={12} className="text-slate-400" /> Not Working
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="size-2 rounded-full bg-primary/50" /> Today
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Block Time Modal */}
      <Modal
        isOpen={isBlockingModalOpen}
        onClose={() => setIsBlockingModalOpen(false)}
        title={`Block Time - ${format(selectedDate, 'MMM do')}`}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <input 
              type="checkbox" 
              id="fullDay"
              checked={blockData.isFullDay}
              onChange={(e) => setBlockData({ ...blockData, isFullDay: e.target.checked })}
              className="size-5 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label htmlFor="fullDay" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              Block Entire Day
            </label>
          </div>

          {!blockData.isFullDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
                <input 
                  type="time" 
                  value={blockData.start_time}
                  onChange={(e) => setBlockData({ ...blockData, start_time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Time</label>
                <input 
                  type="time" 
                  value={blockData.end_time}
                  onChange={(e) => setBlockData({ ...blockData, end_time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reason (Optional)</label>
            <input 
              type="text" 
              value={blockData.reason}
              onChange={(e) => setBlockData({ ...blockData, reason: e.target.value })}
              placeholder="e.g. Personal Leave, Surgery, Conference"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsBlockingModalOpen(false)}>Cancel</Button>
            <Button onClick={handleBlockTime} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 animate-spin" size={16} />}
              Confirm Block
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
