import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, query, where, runTransaction, orderBy, limit 
} from 'firebase/firestore';

export interface LoyaltyTransaction {
  id?: string;
  customerId: string;
  points: number;  // positive = earned, negative = redeemed
  reason: string;
  type: 'completed_visit' | 'review' | 'referral' | 'redemption' | 'streak_bonus' | 'signup_bonus';
  businessId?: string;
  tokenId?: string;
  timestamp: number;
  createdAt: string;
}

export async function awardLoyaltyPoints(params: {
  customerId: string;
  points: number;
  reason: string;
  type: LoyaltyTransaction['type'];
  tokenId?: string;
  businessId?: string;
}): Promise<boolean> {
  try {
    // Duplicate detection based on tokenId and type
    if (params.tokenId) {
      const dupQuery = query(
        collection(db, 'loyaltyTransactions'),
        where('customerId', '==', params.customerId),
        where('tokenId', '==', params.tokenId),
        where('type', '==', params.type)
      );
      const dupSnap = await getDocs(dupQuery);
      if (!dupSnap.empty) {
        console.warn('Duplicate loyalty points detected.');
        return false;
      }
    }

    const customerRef = doc(db, 'customers', params.customerId);
    
    await runTransaction(db, async (transaction) => {
      const customerDoc = await transaction.get(customerRef);
      if (!customerDoc.exists()) throw new Error('Customer not found');
      
      const currentPoints = customerDoc.data().loyaltyPoints || 0;
      transaction.update(customerRef, { loyaltyPoints: currentPoints + params.points });

      const newTxRef = doc(collection(db, 'loyaltyTransactions'));
      transaction.set(newTxRef, {
        ...params,
        id: newTxRef.id,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      });
    });
    
    return true;
  } catch (error) {
    console.error('awardLoyaltyPoints failed:', error);
    return false;
  }
}

export async function getLoyaltyBalance(customerId: string): Promise<number> {
  try {
    const docSnap = await getDoc(doc(db, 'customers', customerId));
    if (docSnap.exists()) {
      return docSnap.data().loyaltyPoints || 0;
    }
    return 0;
  } catch (error) {
    console.error('getLoyaltyBalance failed:', error);
    return 0;
  }
}

export async function getLoyaltyHistory(customerId: string, queryLimit = 50): Promise<LoyaltyTransaction[]> {
  try {
    const q = query(
      collection(db, 'loyaltyTransactions'),
      where('customerId', '==', customerId),
      orderBy('timestamp', 'desc'),
      limit(queryLimit)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyTransaction));
  } catch (error) {
    console.error('getLoyaltyHistory failed:', error);
    return [];
  }
}

export async function redeemPoints(customerId: string, points: number, reason: string): Promise<boolean> {
  if (points <= 0) return false;
  
  try {
    const customerRef = doc(db, 'customers', customerId);
    let success = false;
    
    await runTransaction(db, async (transaction) => {
      const customerDoc = await transaction.get(customerRef);
      if (!customerDoc.exists()) throw new Error('Customer not found');
      
      const currentPoints = customerDoc.data().loyaltyPoints || 0;
      if (currentPoints < points) throw new Error('Insufficient points');
      
      transaction.update(customerRef, { loyaltyPoints: currentPoints - points });
      
      const newTxRef = doc(collection(db, 'loyaltyTransactions'));
      transaction.set(newTxRef, {
        customerId,
        points: -points,
        reason,
        type: 'redemption',
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      });
      success = true;
    });
    
    return success;
  } catch (error) {
    console.error('redeemPoints failed:', error);
    return false;
  }
}
