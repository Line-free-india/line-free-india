import { useState, useEffect } from 'react';
import { useApp, FamilyMemberBooking } from '../store/AppContext';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { Users, UserPlus, Trash2, Check, Heart, Shield } from 'lucide-react';

interface FamilyProfilesProps {
  selectedMemberId?: string;
  onSelectMember?: (member: FamilyMemberBooking) => void;
  isSelectionMode?: boolean;
}

const RELATIONSHIPS: { id: FamilyMemberBooking['relationship']; label: string; icon: string }[] = [
  { id: 'self', label: 'Self (खुद)', icon: '👤' },
  { id: 'father', label: 'Father (पिता जी)', icon: '👴' },
  { id: 'mother', label: 'Mother (माता जी)', icon: '👵' },
  { id: 'spouse', label: 'Spouse (पति/पत्नी)', icon: '💍' },
  { id: 'child', label: 'Child (बेटा/बेटी)', icon: '👶' },
  { id: 'grandparent', label: 'Grandparent (दादा/दादी)', icon: '🧓' },
  { id: 'sibling', label: 'Sibling (भाई/बहन)', icon: '👫' },
  { id: 'other', label: 'Other (अन्य)', icon: '👥' },
];

export default function FamilyProfiles({
  selectedMemberId,
  onSelectMember,
  isSelectionMode = false,
}: FamilyProfilesProps) {
  const { user, customerProfile } = useApp();
  const [members, setMembers] = useState<FamilyMemberBooking[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState<FamilyMemberBooking['relationship']>('self');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [bloodGroup, setBloodGroup] = useState('');
  const [abhaId, setAbhaId] = useState('');

  // Load family members from LocalStorage or Firestore
  useEffect(() => {
    async function loadMembers() {
      if (!user) {
        // Fallback to local storage
        const saved = localStorage.getItem('lf_family_members');
        if (saved) {
          try {
            setMembers(JSON.parse(saved));
          } catch {}
        }
        return;
      }

      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'family_members'));
        const list: FamilyMemberBooking[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as FamilyMemberBooking) }));

        if (list.length === 0 && customerProfile?.name) {
          // Pre-populate Self profile
          const selfMember: FamilyMemberBooking = {
            id: 'self',
            fullName: customerProfile.name,
            relationship: 'self',
            gender: 'other',
          };
          list.push(selfMember);
        }
        setMembers(list);
        localStorage.setItem('lf_family_members', JSON.stringify(list));
      } catch (err) {
        console.warn('Could not load family members from Firestore, using cached:', err);
        const saved = localStorage.getItem('lf_family_members');
        if (saved) setMembers(JSON.parse(saved));
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [user, customerProfile]);

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const newId = 'fam_' + Date.now();
    const newMember: FamilyMemberBooking = {
      id: newId,
      fullName: fullName.trim(),
      relationship,
      age: age ? Number(age) : undefined,
      gender,
      bloodGroup: bloodGroup.trim() || undefined,
      abhaId: abhaId.trim() || undefined,
    };

    const updated = [...members, newMember];
    setMembers(updated);
    localStorage.setItem('lf_family_members', JSON.stringify(updated));

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'family_members', newId), newMember);
      } catch (err) {
        console.warn('Failed to sync family member to Firestore:', err);
      }
    }

    // Reset Form
    setFullName('');
    setAge('');
    setBloodGroup('');
    setAbhaId('');
    setShowAddForm(false);

    if (onSelectMember) {
      onSelectMember(newMember);
    }
  };

  const handleDeleteMember = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    localStorage.setItem('lf_family_members', JSON.stringify(updated));

    if (user && id !== 'self') {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'family_members', id));
      } catch (err) {
        console.warn('Could not delete from Firestore:', err);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-wider text-text">
            {isSelectionMode ? 'Booking For (किसके लिए टोकन है?)' : 'Family Profiles & Patients'}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {showAddForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {members.map((member) => {
          const isSelected = selectedMemberId === member.id || (!selectedMemberId && member.relationship === 'self');
          const relObj = RELATIONSHIPS.find((r) => r.id === member.relationship);

          return (
            <div
              key={member.id}
              onClick={() => onSelectMember && onSelectMember(member)}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary'
                  : 'bg-card border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xl">{relObj?.icon || '👤'}</span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="mt-2">
                <p className="font-bold text-xs text-text truncate">{member.fullName}</p>
                <p className="text-[10px] text-text-dim capitalize">
                  {member.relationship} {member.age ? `&bull; ${member.age} yrs` : ''}
                </p>
                {member.bloodGroup && (
                  <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded-md border border-red-500/20">
                    🩸 {member.bloodGroup}
                  </span>
                )}
              </div>

              {!isSelectionMode && member.relationship !== 'self' && (
                <button
                  onClick={(e) => member.id && handleDeleteMember(member.id, e)}
                  className="absolute top-2 right-2 text-text-dim hover:text-red-400 p-1 transition"
                  title="Remove Member"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Member Form */}
      {showAddForm && (
        <form onSubmit={handleSaveMember} className="p-4 rounded-2xl bg-card border border-primary/30 space-y-3 animate-fadeIn">
          <p className="text-xs font-bold text-text flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" /> Add Family Member / Patient Profile
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-text-dim block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full p-2.5 rounded-xl bg-background border border-border text-xs font-semibold text-text focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-dim block mb-1">Relationship *</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-background border border-border text-xs font-semibold text-text focus:outline-none focus:border-primary"
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.icon} {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-text-dim block mb-1">Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Years"
                className="w-full p-2 rounded-xl bg-background border border-border text-xs text-text"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-dim block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full p-2 rounded-xl bg-background border border-border text-xs text-text"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-dim block mb-1">Blood Group</label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                placeholder="e.g. O+"
                className="w-full p-2 rounded-xl bg-background border border-border text-xs text-text uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-dim block mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> ABHA Health ID / National ID (Optional)
            </label>
            <input
              type="text"
              value={abhaId}
              onChange={(e) => setAbhaId(e.target.value)}
              placeholder="14-digit ABHA Number"
              className="w-full p-2.5 rounded-xl bg-background border border-border text-xs text-text"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:opacity-90 transition cursor-pointer"
          >
            Save Profile
          </button>
        </form>
      )}
    </div>
  );
}
