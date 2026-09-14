import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, PetProfile } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';
import ResponsiveContainer from '../components/ResponsiveContainer';

export default function CustomerPets() {
  const { user, customerProfile } = useApp();
  const nav = useNavigate();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [lastVaccine, setLastVaccine] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (customerProfile?.pets) {
      setPets(customerProfile.pets);
    }
  }, [customerProfile]);

  const saveToDb = async (newPets: PetProfile[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'customers', user.uid), { pets: newPets });
      triggerHaptic('success');
      setShowAdd(false);
      resetForm();
    } catch (e: any) {
      alert('Error updating pets: ' + e.message);
    }
    setSaving(false);
  };

  const resetForm = () => {
    setName(''); setSpecies('Dog'); setBreed(''); setLastVaccine(''); setInfo('');
  };

  const handleAddPet = async () => {
    if (!name || !species) return alert('Name and species are required!');
    const newPet: PetProfile = {
      id: Date.now().toString(),
      name,
      species,
      breed,
      lastVaccine: lastVaccine ? new Date(lastVaccine).getTime() : 0,
      info,
    };
    await saveToDb([...pets, newPet]);
  };

  const deletePet = async (id: string) => {
    if (!confirm('Remove this pet?')) return;
    await saveToDb(pets.filter(p => p.id !== id));
  };

  const getPetIcon = (s: string) => {
    const sp = s.toLowerCase();
    if (sp.includes('dog')) return '🐕';
    if (sp.includes('cat')) return '🐈';
    if (sp.includes('bird') || sp.includes('parrot')) return '🦜';
    if (sp.includes('fish')) return '🐠';
    if (sp.includes('rabbit')) return '🐇';
    return '🐾';
  };

  return (
    <ResponsiveContainer variant="customer">
    <div className="min-h-screen pb-20 animate-fadeIn fade-in">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg">My Pets 🐾</h1>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">{pets.length} companion(s)</p>
          </div>
        </div>
        {!showAdd && (
          <button onClick={() => { triggerHaptic('light'); setShowAdd(true); }} className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xl font-bold shadow-sm active:scale-95">+</button>
        )}
      </div>

      <div className="p-4 space-y-4 pt-6">
        {showAdd && (
          <div className="p-5 rounded-3xl bg-card border border-primary/30 shadow-lg animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-primary text-xl">New Pet</h2>
              <button onClick={() => setShowAdd(false)} className="text-text-dim text-2xl font-black">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Pet Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Max, Bella..." className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none font-bold text-text" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Species</label>
                  <select value={species} onChange={e => setSpecies(e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none font-bold text-text appearance-none">
                    <option>Dog</option>
                    <option>Cat</option>
                    <option>Bird</option>
                    <option>Fish</option>
                    <option>Rabbit</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Breed</label>
                  <input type="text" value={breed} onChange={e => setBreed(e.target.value)} placeholder="e.g. Husky" className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none font-bold text-text" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Last Vaccination Date</label>
                <input type="date" value={lastVaccine} onChange={e => setLastVaccine(e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none font-bold text-text" />
              </div>
              <div>
                <label className="text-xs font-bold text-text-dim uppercase tracking-wider ml-1">Medical Info / Allergies</label>
                <textarea value={info} onChange={e => setInfo(e.target.value)} placeholder="Optional..." className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:border-primary/50 outline-none text-sm resize-none" rows={2} />
              </div>
              <button onClick={handleAddPet} disabled={saving} className="w-full py-3.5 mt-2 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/30 active:scale-95 transition-transform disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Pet'}
              </button>
            </div>
          </div>
        )}

        {pets.length === 0 && !showAdd && (
          <div className="text-center py-20">
            <div className="text-7xl mb-4 opacity-70">🐶</div>
            <h3 className="font-black text-xl mb-1">No pets yet</h3>
            <p className="text-text-dim text-sm max-w-[200px] mx-auto leading-relaxed">Add your furry friends to easily manage their vet and grooming appointments.</p>
            <button onClick={() => setShowAdd(true)} className="mt-6 px-6 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">
              Add Your First Pet
            </button>
          </div>
        )}

        <div className="space-y-4">
          {pets.map(pet => (
            <div key={pet.id} className="relative p-5 rounded-3xl bg-card border border-border shadow-md overflow-hidden animate-slideUp">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-10 translate-x-10" />
              <button onClick={() => deletePet(pet.id)} className="absolute top-4 right-4 text-xs font-bold text-danger bg-danger/10 p-2 rounded-lg border border-danger/20 hover:bg-danger/20 transition-colors">🗑️ Delete</button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-card-2 border border-border shadow-inner flex items-center justify-center text-4xl">
                  {getPetIcon(pet.species)}
                </div>
                <div>
                  <h3 className="font-black text-2xl text-text leading-none">{pet.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20">{pet.species}</span>
                    {pet.breed && <span className="text-xs text-text-dim font-bold">{pet.breed}</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="p-3 bg-background rounded-xl border border-border/50">
                  <p className="text-xs text-text-dim font-bold uppercase tracking-widest mb-0.5">Vaccination</p>
                  <p className={`text-sm font-black ${pet.lastVaccine ? 'text-text' : 'text-warning'}`}>
                    {pet.lastVaccine ? new Date(pet.lastVaccine).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Unknown'}
                  </p>
                </div>
                <div className="p-3 bg-background rounded-xl border border-border/50">
                  <p className="text-xs text-text-dim font-bold uppercase tracking-widest mb-0.5">ID / Tracker</p>
                  <p className="text-sm font-black text-text font-mono opacity-80">#{pet.id.slice(-6)}</p>
                </div>
              </div>
              
              {pet.info && (
                <div className="mt-3 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                  <p className="text-xs text-primary font-black uppercase tracking-widest mb-1">Medical / Diet Notes</p>
                  <p className="text-xs text-text-dim font-medium leading-relaxed">{pet.info}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    </ResponsiveContainer>
  );
}
