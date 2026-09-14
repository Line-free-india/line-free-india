import { db } from '../firebase';
import { 
  runTransaction, doc, collection, getDocs, query, where, setDoc 
} from 'firebase/firestore';
import { TokenEntry } from '../store/AppContext';

export async function generateAtomicToken(params: {
  businessId: string;
  date: string;
  tokenData: Omit<TokenEntry, 'id' | 'tokenNumber'>;
}): Promise<{ tokenId: string; tokenNumber: number }> {
  const tokensRef = collection(db, 'tokens');
  const newTokenRef = doc(tokensRef);

  // 1. Try atomic transaction on queueCounters
  try {
    const counterRef = doc(db, 'queueCounters', `${params.businessId}_${params.date}`);

    const tokenNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextNumber = 1;

      if (counterDoc.exists()) {
        nextNumber = (counterDoc.data().currentNumber || 0) + 1;
        transaction.update(counterRef, { currentNumber: nextNumber });
      } else {
        transaction.set(counterRef, { currentNumber: nextNumber, salonId: params.businessId });
      }

      transaction.set(newTokenRef, {
        ...params.tokenData,
        id: newTokenRef.id,
        tokenNumber: nextNumber,
        date: params.date,
        salonId: params.businessId
      });

      return nextNumber;
    });

    return { tokenId: newTokenRef.id, tokenNumber };
  } catch (txError) {
    console.warn('Atomic counter transaction failed, switching to resilient direct booking:', txError);

    // 2. Direct resilient fallback: get existing tokens count
    try {
      let nextNumber = 1;
      try {
        const q = query(
          collection(db, 'tokens'),
          where('salonId', '==', params.businessId),
          where('date', '==', params.date)
        );
        const snap = await getDocs(q);
        let maxNum = 0;
        snap.forEach((d) => {
          const num = d.data()?.tokenNumber;
          if (typeof num === 'number' && num > maxNum) maxNum = num;
        });
        nextNumber = maxNum > 0 ? maxNum + 1 : snap.size + 1;
      } catch (countErr) {
        console.warn('Count fallback error, generating random token sequence:', countErr);
        nextNumber = Math.floor(Math.random() * 50) + 1;
      }

      await setDoc(newTokenRef, {
        ...params.tokenData,
        id: newTokenRef.id,
        tokenNumber: nextNumber,
        date: params.date,
        salonId: params.businessId,
        createdAt: Date.now()
      });

      return { tokenId: newTokenRef.id, tokenNumber: nextNumber };
    } catch (directError) {
      console.error('All token generation paths failed:', directError);
      throw new Error('Failed to generate token. Please check internet connectivity.');
    }
  }
}

export function calculateSmartETA(params: {
  activeStaffCount: number;
  currentQueue: TokenEntry[];
  requestedServiceDuration: number;
  historicalAvgServiceTime?: number;
  queueDelay?: number;
}): { estimatedMinutes: number; estimatedTime: Date; confidence: number } {
  try {
    const defaultDuration = params.historicalAvgServiceTime || 20;
    let totalQueueTime = 0;
    
    // Add waiting & serving times
    for (const token of params.currentQueue) {
      const duration = token.totalTime || defaultDuration;
      if (token.status === 'serving') {
        // Customer is already being served.
        if (token.servingStartedAt) {
          const elapsed = (Date.now() - token.servingStartedAt) / 60000;
          totalQueueTime += Math.max(2, Math.round(duration - elapsed));
        } else {
          // Assume halfway through on average
          totalQueueTime += Math.max(3, Math.round(duration * 0.5));
        }
      } else if (token.status === 'waiting') {
        totalQueueTime += duration;
      }
    }
    
    const staff = Math.max(1, params.activeStaffCount);
    let waitMinutes = totalQueueTime / staff;
    
    if (params.queueDelay) {
      waitMinutes += params.queueDelay;
    }

    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + waitMinutes);

    const confidence = params.historicalAvgServiceTime ? 88 : (params.currentQueue.length <= 4 ? 80 : 65);

    return {
      estimatedMinutes: Math.round(waitMinutes),
      estimatedTime,
      confidence
    };
  } catch (error) {
    console.error('calculateSmartETA failed:', error);
    return { estimatedMinutes: 30, estimatedTime: new Date(Date.now() + 30 * 60000), confidence: 0 };
  }
}

export function calculateSmartArrival(params: {
  estimatedServiceTime: Date;
  travelTimeMinutes: number;
  bufferMinutes?: number;
}): { recommendedDepartureTime: Date; leaveInMinutes: number; confidence: number } {
  try {
    const buffer = params.bufferMinutes || 10;
    const totalAdvanceMinutes = params.travelTimeMinutes + buffer;
    
    const departureTime = new Date(params.estimatedServiceTime.getTime() - totalAdvanceMinutes * 60000);
    const leaveInMinutes = Math.max(0, Math.round((departureTime.getTime() - Date.now()) / 60000));
    
    return {
      recommendedDepartureTime: departureTime,
      leaveInMinutes,
      confidence: 90
    };
  } catch (error) {
    console.error('calculateSmartArrival failed:', error);
    return { recommendedDepartureTime: new Date(), leaveInMinutes: 0, confidence: 0 };
  }
}

export function calculateQueueHealth(params: {
  waitingCount: number;
  avgServiceTimeMinutes: number;
  activeStaffCount: number;
  expectedDelayMinutes: number;
}): { score: number; status: 'smooth' | 'moderate' | 'busy' | 'heavy_rush'; label: string; color: string } {
  try {
    const staff = Math.max(1, params.activeStaffCount);
    const estimatedTotalWait = (params.waitingCount * params.avgServiceTimeMinutes) / staff + params.expectedDelayMinutes;

    if (estimatedTotalWait < 20) {
      return { score: 90, status: 'smooth', label: 'Smooth', color: 'green' };
    } else if (estimatedTotalWait < 45) {
      return { score: 70, status: 'moderate', label: 'Moderate', color: 'orange' };
    } else if (estimatedTotalWait < 90) {
      return { score: 40, status: 'busy', label: 'Busy', color: 'red' };
    } else {
      return { score: 10, status: 'heavy_rush', label: 'Heavy Rush', color: 'darkred' };
    }
  } catch (error) {
    console.error('calculateQueueHealth failed:', error);
    return { score: 50, status: 'moderate', label: 'Unknown', color: 'gray' };
  }
}

export function calculateHoldExpiry(holdStartTime: number, maxHoldMinutes: number): {
  expiresAt: number;
  remainingSeconds: number;
  isExpired: boolean;
} {
  try {
    const expiresAt = holdStartTime + maxHoldMinutes * 60 * 1000;
    const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    return {
      expiresAt,
      remainingSeconds,
      isExpired: remainingSeconds <= 0
    };
  } catch (error) {
    console.error('calculateHoldExpiry failed:', error);
    return { expiresAt: 0, remainingSeconds: 0, isExpired: true };
  }
}

export async function getSalonTokensEfficient(salonId: string, date: string): Promise<TokenEntry[]> {
  try {
    const q = query(
      collection(db, 'tokens'), 
      where('salonId', '==', salonId), 
      where('date', '==', date)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TokenEntry));
  } catch (error) {
    console.error('getSalonTokensEfficient failed:', error);
    return [];
  }
}

export function getPermittedTokenUpdates(userId: string, token: TokenEntry, updates: Partial<TokenEntry>): Partial<TokenEntry> | null {
  try {
    const allowedCustomerUpdates = ['status', 'isPaused', 'specialInstructions'];
    const allowedBusinessUpdates = ['status', 'totalPrice', 'estimatedWaitMinutes', 'assignedStaffId'];
    
    const isCustomer = token.customerId === userId;
    const isBusiness = token.salonId === userId;
    
    if (!isCustomer && !isBusiness) return null;
    
    const filteredUpdates: Partial<TokenEntry> = {};
    const allowedKeys = isBusiness ? allowedBusinessUpdates : allowedCustomerUpdates;
    
    for (const key of Object.keys(updates)) {
      if (allowedKeys.includes(key)) {
        // @ts-ignore
        filteredUpdates[key as keyof TokenEntry] = updates[key as keyof TokenEntry];
      }
    }
    
    return filteredUpdates;
  } catch (error) {
    console.error('getPermittedTokenUpdates failed:', error);
    return null;
  }
}
