import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Filter, Star, Clock, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useSocket } from '../contexts/SocketContext';

export function DoctorDirectory() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const { socket } = useSocket();

  useEffect(() => {
    fetch('/api/doctors')
      .then(res => res.json())
      .then(data => setDoctors(data));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAvailabilityUpdate = ({ id, is_available }: { id: number, is_available: boolean }) => {
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, is_available: is_available ? 1 : 0 } : d));
    };

    socket.on('doctor_availability_updated', handleAvailabilityUpdate);
    return () => {
      socket.off('doctor_availability_updated', handleAvailabilityUpdate);
    };
  }, [socket]);

  const departments = ['All', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology'];

  const filteredDoctors = doctors
    .filter(d => {
      const matchesDept = filter === 'All' || d.specialization?.includes(filter);
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           d.specialization.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDept && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'experience') return b.experience - a.experience;
      return 0;
    });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Doctors Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Browse our world-class medical specialists and book your consultation.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search doctors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none w-64"
            />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="rating">Top Rated</option>
            <option value="experience">Most Experienced</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
          <Filter className="text-slate-400" size={18} />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Departments:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setFilter(dept)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                filter === dept 
                  ? "bg-primary/10 text-primary" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {dept}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-wider">
          Showing {filteredDoctors.length} of {doctors.length} doctors
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDoctors.map((doctor) => (
          <div 
            key={doctor.id} 
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-2xl hover:border-primary/30 transition-all group"
          >
            <div className="relative h-64 overflow-hidden">
              <img 
                src={doctor.avatar} 
                alt={doctor.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-4 left-4">
                {doctor.is_available ? (
                  <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span> Available
                  </span>
                ) : (
                  <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="size-1.5 bg-rose-500 rounded-full"></span> Unavailable
                  </span>
                )}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="mb-4">
                <h3 className="text-slate-900 dark:text-white font-black text-lg">{doctor.name}</h3>
                <p className="text-primary text-xs font-bold uppercase tracking-wider">{doctor.specialization}</p>
              </div>
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm mb-6">
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span className="font-medium">{doctor.experience} yrs exp</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-slate-900 dark:text-white">{doctor.rating}</span>
                </div>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm">Details</Button>
                <Link to={`/book/${doctor.id}`} className="w-full">
                  <Button size="sm" className="w-full" disabled={!doctor.is_available}>
                    {doctor.is_available ? 'Book Now' : 'Unavailable'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
