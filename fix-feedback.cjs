const fs = require('fs');
const file = 'src/pages/UniversalFeedbackLoop.tsx';
let content = fs.readFileSync(file, 'utf8');

// Inject getReviews
content = content.replace(
  "import { useApp, FeedbackRequest } from '../store/AppContext';",
  "import { useApp, FeedbackRequest, ReviewEntry } from '../store/AppContext';"
);

// We'll replace the state and effects to pull real reviews
const componentBodyOld = /export default function UniversalFeedbackLoop\(\) \{[\s\S]*?return \(/;
const componentBodyNew = `export default function UniversalFeedbackLoop() {
  const { user, businessProfile, getReviews } = useApp();
  const nav = useNavigate();
  const [requests, setRequests] = useState<FeedbackRequest[]>([]);
  const [realReviews, setRealReviews] = useState<ReviewEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceProvided, setServiceProvided] = useState('');

  useEffect(() => {
    if (businessProfile?.feedbackRequests) {
      setRequests(businessProfile.feedbackRequests);
    }
    if (businessProfile?.uid) {
      getReviews(businessProfile.uid).then(revs => setRealReviews(revs));
    }
  }, [businessProfile, getReviews]);

  const saveToDb = async (newRequests: FeedbackRequest[]) => {
    if (!user) return;
    setSaving(true);
    try {
      const sorted = [...newRequests].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      await updateDoc(doc(db, 'users', user.uid), { feedbackRequests: sorted });
      setRequests(sorted);
      triggerHaptic('success');
    } catch (e: any) {
      console.error('Error updating feedback:', e);
    }
    setSaving(false);
  };

  const generateRequest = async () => {
    if (!customerName || !serviceProvided) {
        console.error('Name and Service are required');
        return;
    }
    
    const newReq: FeedbackRequest = {
      id: Date.now().toString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceProvided: serviceProvided.trim(),
      date: new Date().toISOString(),
      status: 'Pending'
    };

    await saveToDb([newReq, ...requests]);
    setCustomerName('');
    setCustomerPhone('');
    setServiceProvided('');
  };

  const markAsSent = async (id: string, phone: string, name: string) => {
    const message = \`Hi \${name}, thank you for choosing \${businessProfile?.businessName || 'us'}! We hope you loved your \${serviceProvided || 'service'} today. Please take 1 minute to leave us a review here: [Link] 🙏\`;
    if (phone) {
      window.open(\`https://wa.me/91\${phone}?text=\${encodeURIComponent(message)}\`, '_blank');
    } else {
      console.log('No phone number attached. Sending mock text: ' + message);
    }

    const updated = requests.map(r => r.id === id ? { ...r, status: 'Sent' as const } : r);
    await saveToDb(updated);
  };

  const deleteRequest = async (id: string) => {
    if (confirm('Delete this feedback request?')) {
      await saveToDb(requests.filter(r => r.id !== id));
    }
  };

  const avgRating = realReviews.length > 0 
    ? realReviews.reduce((sum, r) => sum + r.rating, 0) / realReviews.length 
    : 0;

  return (`;

content = content.replace(componentBodyOld, componentBodyNew);

// Replace the render of the requests to also show real reviews
const listOld = /\{requests\.length === 0 \? \([\s\S]*?\)\} \/\* End List \*\//;
const listNew = `{requests.length === 0 && realReviews.length === 0 ? (
             <div className="text-center py-6 border border-dashed border-border rounded-3xl opacity-50 bg-card">
               <span className="text-3xl block mb-2">💬</span>
               <p className="text-xs font-bold text-text-dim">No requests or reviews tracked yet.</p>
             </div>
           ) : (
             <div className="grid gap-3">
               {realReviews.map(r => (
                 <div key={r.id} className="p-4 rounded-2xl elite-glass spatial-card flex flex-col gap-2 border-primary/20 border">
                     <div className="flex justify-between items-start">
                       <div>
                         <h4 className="font-black text-text text-sm">{r.customerName || 'Customer'}</h4>
                         <p className="text-xs text-text-dim uppercase tracking-wider">{new Date(r.createdAt).toLocaleDateString('en-GB')}</p>
                       </div>
                       <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded text-amber-500 text-xs font-black pointer-events-none">
                         {r.rating} ⭐
                       </div>
                     </div>
                     <div className="bg-background rounded-xl p-3 text-xs italic text-text-dim border border-border">
                       "{r.reviewText}"
                     </div>
                 </div>
               ))}
               {requests.map(r => {
                 return (
                   <div key={r.id} className="p-4 rounded-2xl elite-glass spatial-card flex flex-col gap-2 opacity-70">
                     <div className="flex justify-between items-start">
                       <div>
                         <h4 className="font-black text-text text-sm">{r.customerName}</h4>
                         <p className="text-xs text-text-dim uppercase tracking-wider">{r.serviceProvided} • {new Date(r.date).toLocaleDateString('en-GB')}</p>
                       </div>
                       <div className={\`px-2 py-0.5 rounded text-xs font-black uppercase tracking-widest \${r.status === 'Sent' ? 'bg-primary/20 text-primary' : 'bg-card-2 text-text-dim border border-border'}\`}>
                           {r.status}
                       </div>
                     </div>

                     <div className="flex gap-2 mt-2">
                         {r.status === 'Pending' && (
                           <button onClick={() => markAsSent(r.id, r.customerPhone, r.customerName)} className="flex-1 py-2 bg-green-600/10 text-green-500 rounded-xl font-bold text-xs hover:bg-green-600/20 transition-colors uppercase tracking-widest">
                             Send WhatsApp Link
                           </button>
                         )}
                         <button onClick={() => deleteRequest(r.id)} className="w-[40px] flex justify-center items-center rounded-xl bg-card-2 hover:bg-danger/20 hover:text-danger text-text-dim transition-colors text-xs">✕</button>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}`;

// I'll just use a smart regex replace for the list part.
content = content.replace(
  /\{requests\.length === 0 \? \([\s\S]*?\}\)\}\n\s*<\/div>\n\s*\)\}/,
  listNew
);

fs.writeFileSync(file, content);
console.log('UniversalFeedbackLoop updated');
