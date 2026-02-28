import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Pill, 
  TestTube, 
  Download, 
  Search,
  Calendar,
  User,
  Activity,
  ChevronRight,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetch(`/api/appointments?userId=${user?.id}&role=patient`)
      .then(res => res.json())
      .then(data => {
        // Filter only completed appointments with diagnosis or prescription
        const medicalRecords = data.filter((appt: any) => 
          appt.status === 'completed' && (appt.diagnosis || appt.prescription)
        );
        setRecords(medicalRecords);
        setIsLoading(false);
      });
  }, [user]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'diagnosis') return matchesSearch && record.diagnosis;
    if (activeFilter === 'prescriptions') return matchesSearch && record.prescription;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">My Medical Records</h1>
          <p className="text-slate-500 dark:text-slate-400">Access your complete medical history, diagnoses, and prescriptions.</p>
        </div>
        <Button className="w-fit">
          <Download className="mr-2" size={18} />
          Export All Records
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by doctor, diagnosis, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['all', 'diagnosis', 'prescriptions', 'lab results'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  activeFilter === filter 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500">Loading your medical history...</p>
          </div>
        ) : filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <Card key={record.id} className="p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-6">
                    <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Calendar size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{record.doctor_name}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {record.department}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {record.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User size={14} />
                          Consultation
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm">
                      <Download size={14} className="mr-2" /> Download PDF
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <FileText size={18} />
                      <h4 className="text-xs font-black uppercase tracking-widest">Diagnosis & Notes</h4>
                    </div>
                    <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {record.diagnosis || "No detailed diagnosis recorded for this visit."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <Pill size={18} />
                      <h4 className="text-xs font-black uppercase tracking-widest">Prescribed Medications</h4>
                    </div>
                    <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {record.prescription || "No medications were prescribed during this visit."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Placeholder for Lab Results */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <TestTube size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Lab Results</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 italic">No lab results attached to this record</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="py-20 text-center">
            <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto mb-6">
              <Activity className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Records Found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              We couldn't find any medical records matching your search or filters.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
