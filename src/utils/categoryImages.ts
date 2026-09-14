/**
 * Category-wise default images for businesses
 * Using curated, high-quality HD images from Unsplash
 */

export const CATEGORY_IMAGES: Record<string, string> = {
  // Beauty & Wellness
  'ladies-beauty': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  'beauty-parlour': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  'beauty_parlour': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  'unisex-salon': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
  'unisex_salon': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
  'mens-salon': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
  'mens_salon': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
  'men_salon': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
  'bridal-studio': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'bridal_studio': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'spa-wellness': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
  'spa_wellness': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
  'spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
  'massage-therapy': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
  'massage_therapy': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
  
  // Healthcare
  'clinic': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  'hospital': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
  'dental-clinic': 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80',
  'dental_clinic': 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80',
  'physiotherapy': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  'ayurveda': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  'acupuncture': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
  
  // Fitness
  'gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  'yoga-studio': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  'yoga_studio': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  'fitness-center': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
  'fitness_center': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
  
  // Food & Beverage
  'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  
  // Professional Services
  'nail-studio': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
  'nail_studio': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
  'tattoo-studio': 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80',
  'tattoo_studio': 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80',
  'mehndi-artist': 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&q=80',
  'mehndi_artist': 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&q=80',
  'photography': 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
  'repair_shop': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
  'pet_care': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80',
  'banking': 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=800&q=80',
  'govt': 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80',
  
  // Default fallback
  'default': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
};

const isValidUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/') || trimmed.startsWith('/assets/');
};

/**
 * Get default image for a business category
 */
export function getCategoryImage(businessType?: string): string {
  if (!businessType) return CATEGORY_IMAGES['default'];
  const key = businessType.toLowerCase().trim();
  const normalizedKey = key.replace(/_/g, '-');
  const underscoreKey = key.replace(/-/g, '_');
  return CATEGORY_IMAGES[key] || CATEGORY_IMAGES[normalizedKey] || CATEGORY_IMAGES[underscoreKey] || CATEGORY_IMAGES['default'];
}

/**
 * Get business image with fallback to category default.
 * Handles any parameter ordering defensively.
 */
export function getBusinessImageWithFallback(
  photoURL?: string,
  bannerImageURL?: string,
  businessType?: string
): string {
  // If first parameter looks like a businessType identifier (e.g. 'mens_salon', 'beauty_parlour')
  if (photoURL && !isValidUrl(photoURL)) {
    if (!businessType) businessType = photoURL;
    photoURL = undefined;
  }
  if (bannerImageURL && !isValidUrl(bannerImageURL)) {
    if (!businessType) businessType = bannerImageURL;
    bannerImageURL = undefined;
  }

  if (isValidUrl(photoURL)) return photoURL!;
  if (isValidUrl(bannerImageURL)) return bannerImageURL!;
  return getCategoryImage(businessType);
}
