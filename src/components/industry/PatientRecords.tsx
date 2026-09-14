import React, { useState } from 'react';
import { Search, UserPlus, Heart, FileText, Activity, Clock, Trash2, Edit2, PlusCircle, CheckCircle2 } from 'lucide-react';

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  lastVisit: string;
  diagnosis: string;
  vitals: {
    bp: string;
    pulse: number;
    temp: string;
  };
  status: 'In Consultation' | 'Completed' | 'Waiting';
}

const PatientRecords: React.FC = () => {
  const [patients, setPatients] = useState<PatientRecord[]>([
    {
      id: '1', name: 'Rahul Sharma', age: 34, gender: 'Male', lastVisit: '2024-03-28',
      diagnosis: 'Seasonal Flu', vitals: { bp: '120/80', pulse: 72, temp: '98.6°F' },
      status: 'Completed'
    },
    {
      id: '2', name: 'Anjali Gupta', age: 28, gender: 'Female', lastVisit: '2024-03-29',
      diagnosis: 'Mild Allergy', vitals: { bp: '110/70', pulse: 80, temp: '99.1°F' },
      status: 'In Consultation'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: PatientRecord['status']) => {
    switch (status) {
      case 'In Consultation': return 'text-primary bg-primary/10';
      case 'Completed': return 'text-success bg-success/10';
      case 'Waiting': return 'text-warning bg-warning/10';
      default: return 'text-text-dim bg-white/5';
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-inter">Patient Health Records</h2>
        <button className="btn-primary flex items-center gap-2 px-4 py-2 text-sm w-auto">
          <UserPlus size={18} /> New Patient
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
        <input 
          type="text" 
          placeholder="Search patients by name..." 
          className="input-field pl-10"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPatients.map(patient => (
          <div key={patient.id} className="premium-card p-5 glass-card animate-slideUp">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{patient.name}</h3>
                <p className="text-sm text-text-dim">{patient.age}y • {patient.gender}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(patient.status)}`}>
                {patient.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-white/5 rounded-xl border border-white/5">
                <p className="text-xs text-text-dim uppercase font-bold mb-1">BP</p>
                <p className="font-mono text-xs">{patient.vitals.bp}</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-xl border border-white/5">
                <p className="text-xs text-text-dim uppercase font-bold mb-1">Pulse</p>
                <div className="flex items-center justify-center gap-1">
                  <Activity size={10} className="text-danger animate-pulse" />
                  <p className="font-mono text-xs">{patient.vitals.pulse}</p>
                </div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-xl border border-white/5">
                <p className="text-xs text-text-dim uppercase font-bold mb-1">Temp</p>
                <p className="font-mono text-xs">{patient.vitals.temp}</p>
              </div>
            </div>

            <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary uppercase">Latest Diagnosis</span>
              </div>
              <p className="text-sm font-medium">{patient.diagnosis}</p>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 text-text-dim">
                <Clock size={14} />
                <span className="text-xs">Last visit: {patient.lastVisit}</span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/5 rounded-xl text-primary transition-all">
                  <Edit2 size={16} />
                </button>
                <button className="p-2 hover:bg-danger/10 rounded-xl text-danger transition-all">
                  <Trash2 size={16} />
                </button>
                <button className="btn-primary px-3 py-1 text-xs w-auto">
                   View EHR
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredPatients.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
             <Heart size={40} className="mx-auto mb-3 text-text-dim/30" />
             <p className="text-text-dim">No patient records found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRecords;
