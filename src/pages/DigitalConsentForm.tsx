import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, ConsentFormRecord } from '../store/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { triggerHaptic } from '../utils/haptics';

export default function DigitalConsentForm() {
  const { user, businessProfile, services } = useApp();
  const nav = useNavigate();
  const [forms, setForms] = useState<ConsentFormRecord[]>([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const [creatingForm, setCreatingForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceName, setServiceName] = useState('');
  
  // Client Filling State
  const [fillingId, setFillingId] = useState<string | null>(null);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [hasAllergies, setHasAllergies] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (businessProfile?.consentForms) {
      setForms(businessProfile.consentForms);
    }
  }, [businessProfile]);

  const saveToDb = async (newRecords: ConsentFormRecord[]) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { consentForms: newRecords });
      setForms(newRecords);
      triggerHaptic('success');
    } catch (e: any) {
      alert('Error saving consent forms: ' + e.message);
    }
    setSaving(false);
  };

  const createPendingForm = async () => {
    if (!clientName || !clientPhone || !serviceName) {
      return alert('Client Name, Phone, and Service are required to generate a form.');
    }

    const newRec: ConsentFormRecord = {
      id: Date.now().toString(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceName: serviceName,
      dateSigned: '',
      medicalNotes: '',
      hasAllergies: false,
      status: 'pending'
    };

    const updated = [newRec, ...forms];
    await saveToDb(updated);
    
    setCreatingForm(false);
    setClientName('');
    setClientPhone('');
    setServiceName('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startFilling = (id: string) => {
     setFillingId(id);
     setMedicalNotes('');
     setHasAllergies(false);
     setTimeout(() => clearCanvas(), 100);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitSignature = async () => {
    if (!fillingId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // A very basic check to see if canvas is empty (mostly transparent)
    // For production, a deeper pixel check is better, but this is a placeholder.
    const dataUrl = canvas.toDataURL('image/png');
    if (dataUrl.length < 5000) {
        if (!confirm('Signature seems short or empty. Submit anyway?')) return;
    }

    const updated = forms.map(f => {
        if (f.id === fillingId) {
            return {
                ...f,
                status: 'signed' as const,
                dateSigned: new Date().toISOString(),
                medicalNotes: medicalNotes.trim(),
                hasAllergies,
                signatureImage: dataUrl
            };
        }
        return f;
    });

    await saveToDb(updated);
    setFillingId(null);
  };

  const deleteForm = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('Delete this consent record?')) {
      await saveToDb(forms.filter(r => r.id !== id));
      if (fillingId === id) setFillingId(null);
    }
  };

  // Canvas Drawing Logic
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDraw = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2dd4bf'; // teal-400

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.beginPath();
      }
  };

  const sendToClient = (f: ConsentFormRecord) => {
      // Mock sending link via WhatsApp
      const link = `https://app.linefree.in/consent/${f.id}`;
      const text = `*Hi ${f.clientName},*\n\nPlease complete your digital consent/waiver form for your upcoming *${f.serviceName}* safely here:\n${link}\n\n_Thank you!_`;
      const sanitized = '91' + f.clientPhone.replace(/\D/g, '').slice(-10);
      window.open(`https://wa.me/${sanitized}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-20 animate-fadeIn bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-teal-900/20 via-background to-background">
      <div className="p-4 glass-strong sticky top-0 z-20 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/barber/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 hover:bg-border transition-colors">←</button>
          <div>
            <h1 className="font-black text-lg text-teal-400">Digital Consent 📝</h1>
            <p className="text-xs text-teal-200/50 font-bold uppercase tracking-widest">{forms.filter(f => f.status === 'signed').length} Signed • {forms.filter(f => f.status === 'pending').length} Pending</p>
          </div>
        </div>
        <button onClick={() => setCreatingForm(!creatingForm)} className="w-10 h-10 flex items-center justify-center rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-colors">
            {creatingForm ? '✕' : '➕'}
        </button>
      </div>

      <div className="p-4 space-y-6">

        {/* Creator Form - slide down */}
        {creatingForm && (
          <div className="p-5 rounded-3xl elite-glass spatial-card border-teal-500/30 shadow-[0_4px_20px_rgba(20,184,166,0.1)] relative overflow-hidden animate-slideUp">
            <h2 className="font-black text-text text-sm mb-4">Generate New Form Link</h2>
            <div className="space-y-3">
               <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" className="w-full p-3 rounded-xl bg-background border border-border outline-none font-bold text-sm text-teal-100" />
               <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="WhatsApp No." className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-teal-100" />
               
               <select value={serviceName} onChange={e => setServiceName(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-border outline-none text-xs text-teal-300 font-bold">
                   <option value="" disabled>Select Service...</option>
                   {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                   <option value="General Consultation">General Consultation</option>
                   <option value="General Massage">General Massage</option>
                   <option value="Advanced Facial">Advanced Facial</option>
                   <option value="Tattoo Session">Tattoo Session</option>
               </select>

               <div className="pt-2 mt-2 border-t border-border">
                <button disabled={saving} onClick={createPendingForm} className="w-full py-3 bg-teal-600 text-teal-950 rounded-xl font-black shadow-[0_4px_15px_rgba(13,148,136,0.3)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-xs">
                  Generate Form
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Client Signing Interface Overlay */}
        {fillingId && (() => {
            const form = forms.find(f => f.id === fillingId);
            if (!form) return null;
            return (
              <div className="fixed inset-0 z-[60] bg-background overflow-y-auto animate-slideUp p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h2 className="font-black text-lg text-teal-400">Consent & Waiver</h2>
                          <p className="text-xs text-teal-200/50 uppercase tracking-widest font-bold">For {form.serviceName}</p>
                      </div>
                      <button onClick={() => setFillingId(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-card-2 border border-border">✕</button>
                  </div>

                  <div className="flex-1 space-y-6 max-w-md mx-auto w-full">
                      <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-100/80 leading-relaxed font-medium">
                          I, <strong className="text-teal-400">{form.clientName}</strong>, acknowledge that I am receiving <strong className="text-teal-400">{form.serviceName}</strong>. 
                          I understand the risks involved and confirm that I have disclosed all relevant medical conditions.
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="text-xs font-black uppercase tracking-widest text-text-dim block mb-2 ml-1">Medical Conditions / Ongoing Treatments</label>
                              <textarea value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} rows={3} placeholder="Please list any relevant medical info, pregnancies, or recent surgeries..." className="w-full p-4 rounded-2xl bg-card border border-border outline-none text-sm text-teal-50 resize-none focus:border-teal-500/50 transition-colors"></textarea>
                          </div>

                          <label className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border cursor-pointer active:scale-[0.98] transition-all">
                              <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${hasAllergies ? 'bg-danger border-danger text-white' : 'bg-background border-border text-transparent'}`}>✓</div>
                              <div>
                                  <p className="text-xs font-black text-text">I have known skin allergies</p>
                                  <p className="text-xs text-text-dim mt-0.5">Check if you have sensitive skin or product allergies.</p>
                              </div>
                              <input type="checkbox" className="hidden" checked={hasAllergies} onChange={e => setHasAllergies(e.target.checked)} />
                          </label>

                          <div>
                              <div className="flex justify-between items-end mb-2">
                                  <label className="text-xs font-black uppercase tracking-widest text-text-dim ml-1">Digital Signature</label>
                                  <button onClick={clearCanvas} className="text-xs text-teal-500 uppercase tracking-widest font-bold px-2 py-1 bg-teal-500/10 rounded-md">Clear</button>
                              </div>
                              <div className="bg-card border-2 border-dashed border-border rounded-2xl overflow-hidden relative touch-none">
                                  <canvas 
                                      ref={canvasRef}
                                      width={350} 
                                      height={150} 
                                      className="w-full h-[150px] cursor-crosshair"
                                      onMouseDown={startDraw}
                                      onMouseUp={stopDraw}
                                      onMouseOut={stopDraw}
                                      onMouseMove={draw}
                                      onTouchStart={startDraw}
                                      onTouchEnd={stopDraw}
                                      onTouchCancel={stopDraw}
                                      onTouchMove={draw}
                                  />
                                  {!isDrawing && !canvasRef.current?.getContext('2d')?.getImageData(0,0,1,1) /* dumb check */ && (
                                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                                          <span className="text-xl font-black text-text-dim rotate-[-10deg]">Sign Here</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>

                      <button onClick={submitSignature} className="w-full py-4 rounded-2xl bg-teal-600 text-white font-black uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(20,184,166,0.4)] hover:bg-teal-500 active:scale-95 transition-all mt-8">
                          I Agree & Submit
                      </button>
                  </div>
              </div>
            );
        })()}

        {/* Directory View */}
        <div>
           {forms.length === 0 ? (
             <div className="text-center py-8 border border-dashed border-white/10 rounded-3xl opacity-50 elite-glass">
               <span className="text-3xl block mb-2">📑</span>
               <p className="text-xs font-bold text-text-dim">No consent forms generated.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-3">
               {forms.map(f => {
                   const isSigned = f.status === 'signed';
                   
                   return (
                     <div key={f.id} className={`p-4 rounded-3xl elite-glass spatial-card border flex flex-col gap-3 relative shadow-sm transition-colors group ${isSigned ? 'border-teal-500/20 hover:border-teal-500/50' : 'border-white/5 opacity-80'}`}>
                       
                       <div className="flex justify-between items-start">
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <div className={`w-2 h-2 rounded-full ${isSigned ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]' : 'bg-yellow-500'}`}></div>
                             <span className={`text-xs font-black uppercase tracking-widest ${isSigned ? 'text-teal-400' : 'text-yellow-500'}`}>{f.status}</span>
                           </div>
                           <h4 className="font-black text-text text-sm leading-tight text-teal-50 flex items-center gap-2">
                             {f.clientName}
                           </h4>
                           <p className="text-xs font-bold mt-1 text-teal-100/50">{f.serviceName}</p>
                         </div>
    
                         <button onClick={(e) => deleteForm(f.id, e)} className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center text-xs hover:bg-danger/20">✕</button>
                       </div>
    
                       {isSigned ? (
                           <div className="mt-2 pt-3 border-t border-border flex justify-between items-end">
                              <div>
                                  <p className="text-xs font-bold text-text-dim uppercase tracking-widest">Signed On</p>
                                  <p className="text-xs font-black text-teal-200">{new Date(f.dateSigned).toLocaleDateString()} {new Date(f.dateSigned).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                  {f.hasAllergies && <span className="inline-block mt-1 bg-danger/10 text-danger px-1.5 py-0.5 rounded text-xs font-black uppercase tracking-widest">Has Allergies</span>}
                              </div>
                              {f.signatureImage && (
                                  <div className="bg-white rounded-lg p-1 w-20 h-8 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                                      <img src={f.signatureImage} alt="Signature" className="max-w-full max-h-full invert" />
                                  </div>
                              )}
                           </div>
                       ) : (
                           <div className="mt-1 flex gap-2">
                              <button onClick={() => startFilling(f.id)} className="flex-1 py-2 rounded-xl bg-card-2 border border-border text-xs font-black uppercase tracking-widest hover:border-teal-500/50 hover:text-teal-400 transition-colors">
                                Fill Now (Device)
                              </button>
                              <button onClick={() => sendToClient(f)} className="w-12 flex items-center justify-center rounded-xl bg-green-500/10 text-green-500 text-lg hover:bg-green-500 hover:text-white transition-colors border border-green-500/20 relative" title="Send WhatsApp Link">
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                📱
                              </button>
                           </div>
                       )}
                     </div>
                   );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
