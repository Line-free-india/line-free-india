import { db } from '../firebase';
import { 
  collection, getDocs, query, where, addDoc, orderBy, limit as firestoreLimit, startAfter
} from 'firebase/firestore';
import { ReviewEntry } from '../store/AppContext';

export async function canCustomerReview(customerId: string, businessId: string): Promise<{
  canReview: boolean;
  completedTokenId?: string;
  reason?: string;
}> {
  try {
    // Check if customer has a completed token
    const q = query(
      collection(db, 'tokens'),
      where('customerId', '==', customerId),
      where('salonId', '==', businessId),
      where('status', '==', 'done')
    );
    
    const snap = await getDocs(q);
    if (snap.empty) {
      return { canReview: false, reason: 'No completed visits found.' };
    }

    // Ensure they haven't already reviewed
    const reviewQ = query(
      collection(db, 'reviews'),
      where('customerId', '==', customerId),
      where('salonId', '==', businessId)
    );
    const reviewSnap = await getDocs(reviewQ);
    if (!reviewSnap.empty) {
      return { canReview: false, reason: 'Already reviewed.' };
    }

    return { canReview: true, completedTokenId: snap.docs[0].id };
  } catch (error) {
    console.error('canCustomerReview failed:', error);
    return { canReview: false, reason: 'Error checking eligibility' };
  }
}

export async function addVerifiedReview(review: Omit<ReviewEntry, 'id'>, completedTokenId: string): Promise<string | null> {
  try {
    const check = await canCustomerReview(review.customerId, review.salonId);
    if (!check.canReview) {
      throw new Error(check.reason || 'Not eligible to review');
    }

    const reviewRef = await addDoc(collection(db, 'reviews'), {
      ...review,
      tokenId: completedTokenId,
      verified: true
    });
    
    return reviewRef.id;
  } catch (error) {
    console.error('addVerifiedReview failed:', error);
    return null;
  }
}

export async function getBusinessReviews(businessId: string, limitQuery = 10, lastDocument?: any): Promise<{
  reviews: ReviewEntry[];
  hasMore: boolean;
  lastDoc: any;
}> {
  try {
    let q = query(
      collection(db, 'reviews'),
      where('salonId', '==', businessId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitQuery)
    );

    if (lastDocument) {
      q = query(q, startAfter(lastDocument));
    }

    const snap = await getDocs(q);
    const reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewEntry));
    
    return {
      reviews,
      hasMore: snap.docs.length === limitQuery,
      lastDoc: snap.docs[snap.docs.length - 1] || null
    };
  } catch (error) {
    console.error('getBusinessReviews failed:', error);
    return { reviews: [], hasMore: false, lastDoc: null };
  }
}
