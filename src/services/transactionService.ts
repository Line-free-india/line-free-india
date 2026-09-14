import { db } from '../firebase';
import { 
  collection, getDocs, query, where, addDoc 
} from 'firebase/firestore';
import { ServiceItem } from '../store/AppContext';

export interface BusinessTransaction {
  id?: string;
  businessId: string;
  tokenId: string;
  date: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  tipAmount: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet' | 'pending';
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'partial';
  invoiceNumber?: string;
  customerName: string;
  customerId: string;
  services: ServiceItem[];
  staffId?: string;
  createdAt: number;
}

export async function recordTransaction(txn: Omit<BusinessTransaction, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), txn);
    return docRef.id;
  } catch (error) {
    console.error('recordTransaction failed:', error);
    throw error;
  }
}

export async function getDailyRevenue(businessId: string, date: string): Promise<{
  gross: number; net: number; tax: number; discount: number; tips: number;
  pending: number; cash: number; upi: number; card: number; count: number;
}> {
  const result = {
    gross: 0, net: 0, tax: 0, discount: 0, tips: 0,
    pending: 0, cash: 0, upi: 0, card: 0, count: 0
  };

  try {
    const q = query(
      collection(db, 'transactions'),
      where('businessId', '==', businessId),
      where('date', '==', date)
    );
    
    const snap = await getDocs(q);
    
    snap.forEach(docSnap => {
      const data = docSnap.data() as BusinessTransaction;
      result.count += 1;
      result.gross += data.subtotal;
      result.tax += data.taxAmount;
      result.discount += data.discount;
      result.tips += data.tipAmount;
      result.net += data.grandTotal;

      if (data.paymentStatus === 'pending') result.pending += data.grandTotal;
      if (data.paymentMethod === 'cash') result.cash += data.grandTotal;
      if (data.paymentMethod === 'upi') result.upi += data.grandTotal;
      if (data.paymentMethod === 'card') result.card += data.grandTotal;
    });

    return result;
  } catch (error) {
    console.error('getDailyRevenue failed:', error);
    return result;
  }
}

export async function getRevenueRange(businessId: string, startDate: string, endDate: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('businessId', '==', businessId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('getRevenueRange failed:', error);
    return [];
  }
}
