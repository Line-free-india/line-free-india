const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. BusinessProfile Cleanup
content = content.replace(/  doctors\?:.*?\n/g, '');
content = content.replace(/  patientRecords\?:.*?\n/g, '');
content = content.replace(/  kundaliCharts\?:.*?\n/g, '');
content = content.replace(/  savedMuhurats\?:.*?\n/g, '');
content = content.replace(/  homeTuitionStudents\?:.*?\n/g, '');
content = content.replace(/  assignments\?:.*?\n/g, '');
content = content.replace(/  carWashBats\?:.*?\n/g, '');
content = content.replace(/  washPasses\?:.*?\n/g, '');
content = content.replace(/  lawyerCaseFiles\?:.*?\n/g, '');
content = content.replace(/  lawyerHearings\?:.*?\n/g, '');
content = content.replace(/  mechanicSpareParts\?:.*?\n/g, '');
content = content.replace(/  mechanicServiceHistory\?:.*?\n/g, '');
content = content.replace(/  acRepairAMCs\?:.*?\n/g, '');
content = content.replace(/  acRepairDispatches\?:.*?\n/g, '');
content = content.replace(/  clinicVaccinations\?:.*?\n/g, '');
content = content.replace(/  clinicPrescriptions\?:.*?\n/g, '');
content = content.replace(/  astrologyKundalis\?:.*?\n/g, '');
content = content.replace(/  astrologyMuhurats\?:.*?\n/g, '');
content = content.replace(/  tutorStudents\?:.*?\n/g, '');
content = content.replace(/  tutorBatches\?:.*?\n/g, '');
content = content.replace(/  coachingBatches\?:.*?\n/g, '');
content = content.replace(/  mockTests\?:.*?\n/g, '');

// 2. Fix getSalonTokens
content = content.replace(
  /const q = query\(collection\(db, 'tokens'\), where\('salonId', '==', salonId\)\);\s+const snap = await getDocs\(q\);\s+const all = snap.docs.map\(d => \(\{ id: d.id, \.\.\.d.data\(\) \} as TokenEntry\)\);\s+return all.filter\(t => t.date === date\);/g,
  `const q = query(collection(db, 'tokens'), where('salonId', '==', salonId), where('date', '==', date));\n      const snap = await getDocs(q);\n      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TokenEntry));`
);

// 3. Fix getCustomerTokens
content = content.replace(
  /const q = query\(collection\(db, 'tokens'\), where\('customerId', '==', customerId\)\);\s+const snap = await getDocs\(q\);\s+return snap.docs.map\(d => \(\{ id: d.id, \.\.\.d.data\(\) \} as TokenEntry\)\).filter\(t => t.date === today\);/g,
  `const q = query(collection(db, 'tokens'), where('customerId', '==', customerId), where('date', '==', today));\n      const snap = await getDocs(q);\n      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TokenEntry));`
);

// 4. Fix addReview
content = content.replace(
  /const addReview = async \(review: Omit<ReviewEntry, 'id'>\) => {\s+try {\s+await addDoc\(collection\(db, 'reviews'\), review\);/,
  `const addReview = async (review: Omit<ReviewEntry, 'id'>) => {\n    try {\n      // Note: In production, review verification should check for a completed token\n      // (Actual enforcement should be via Firestore security rules)\n      await addDoc(collection(db, 'reviews'), review);`
);

// 5. Fix empty catch blocks
content = content.replace(/catch\s*\{\s*\}/g, "catch (e) { console.error('Caught error:', e); }");
content = content.replace(/catch\s*\(\_\)\s*\{\s*\}/g, "catch (e) { console.error('Caught error:', e); }");

// 6. Fix pushNotification console logs
content = content.replace(/console.log\(`\[FCM PUSH\].*?`\);/g, '// TODO: Implement real FCM integration');
content = content.replace(/console.log\(`\[WHATSAPP\].*?`\);/g, '// TODO: Implement real WhatsApp integration');

// 7. Add comment to getBusinessFullStats
content = content.replace(
  /const getBusinessFullStats = async \(days: number\): Promise<DayStat\[\]> => {\s+if \(\!user\) return \[\];/,
  `const getBusinessFullStats = async (days: number): Promise<DayStat[]> => {\n    // Note: This does sequential full-collection downloads.\n    // In production, this should use pre-aggregated daily stats documents.\n    if (!user) return [];`
);

fs.writeFileSync(file, content);
console.log('App context updated');
