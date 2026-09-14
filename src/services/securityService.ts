import { ROLE } from '../constants';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

export const validateTokenUpdateFields = (role: string, updateData: any) => {
  const customerAllowed = ['isPaused', 'status', 'transferredTo', 'customerPhone', 'customerName'];
  const businessAllowed = ['status', 'assignedStaffId', 'internalNotes', 'rating'];
  const immutable = ['tokenNumber', 'salonId', 'totalPrice', 'createdAt', 'date'];

  const keys = Object.keys(updateData);
  
  if (keys.some(k => immutable.includes(k))) {
    return false;
  }

  if (role === ROLE.CUSTOMER) {
    if (!keys.every(k => customerAllowed.includes(k))) return false;
    if (updateData.status && updateData.status !== 'cancelled') return false;
    return true;
  } else if (role === ROLE.BUSINESS) {
    return keys.every(k => businessAllowed.includes(k));
  } else if (role === ROLE.ADMIN) {
    return true;
  }
  
  return false;
};

export const PRIVATE_BUSINESS_FIELDS = [
  'upiId',
  'fcmToken',
  'blockedCustomerIds',
  'staffMembers',
  'taxSettings',
  'bankDetails'
];

export const buildPublicBusinessProfile = (businessData: any) => {
  const publicProfile = { ...businessData };
  
  PRIVATE_BUSINESS_FIELDS.forEach(field => {
    delete publicProfile[field];
  });
  
  return publicProfile;
};

export const splitBusinessProfile = (businessData: any) => {
  const publicData: Record<string, any> = { ...businessData };
  const privateData: Record<string, any> = {};

  PRIVATE_BUSINESS_FIELDS.forEach(field => {
    if (businessData[field] !== undefined) {
      privateData[field] = businessData[field];
      delete publicData[field];
    }
  });

  return { publicData, privateData };
};

export const validateReviewEligibility = async (customerId: string, businessId: string): Promise<{ isEligible: boolean; completedTokenId?: string }> => {
  try {
    const q = query(
      collection(db, 'tokens'),
      where('customerId', '==', customerId),
      where('salonId', '==', businessId),
      where('status', '==', 'done'),
      limit(1)
    );
    
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { isEligible: true, completedTokenId: snap.docs[0].id };
    }
  } catch (error) {
    console.error('validateReviewEligibility failed:', error);
  }
  return { isEligible: false };
};

export const verifyUserRole = async (uid: string, email?: string | null): Promise<string | null> => {
  try {
    // 1. Check users collection
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists() && userDoc.data()?.role) {
      return userDoc.data().role;
    }

    // 2. Check if business exists in barbers or salons
    const barberDoc = await getDoc(doc(db, 'barbers', uid));
    if (barberDoc.exists()) {
      await setDoc(doc(db, 'users', uid), { role: ROLE.BUSINESS, email: email || '' }, { merge: true });
      return ROLE.BUSINESS;
    }

    // 3. Check if customer exists in customers
    const customerDoc = await getDoc(doc(db, 'customers', uid));
    if (customerDoc.exists()) {
      await setDoc(doc(db, 'users', uid), { role: ROLE.CUSTOMER, email: email || '' }, { merge: true });
      return ROLE.CUSTOMER;
    }

    // 4. Check cached role intent if recently selected by user during registration
    const cachedRole = typeof window !== 'undefined' ? localStorage.getItem('lf_role') : null;
    if (cachedRole === 'business' || cachedRole === 'barber') {
      await setDoc(doc(db, 'users', uid), { role: ROLE.BUSINESS, email: email || '', updatedAt: Date.now() }, { merge: true });
      return ROLE.BUSINESS;
    }
    if (cachedRole === 'customer') {
      await setDoc(doc(db, 'users', uid), { role: ROLE.CUSTOMER, email: email || '', updatedAt: Date.now() }, { merge: true });
      return ROLE.CUSTOMER;
    }

    // 5. Default fallback to customer if user exists in auth
    return ROLE.CUSTOMER;
  } catch (error) {
    console.error('Error verifying user role from Firestore:', error);
    return null;
  }
};
