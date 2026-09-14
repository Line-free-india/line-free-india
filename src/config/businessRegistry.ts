/**
 * Business registry: Line Free India — Multi-Industry Smart Queue System.
 */
import type { BusinessCategory } from '../store/AppContext';
import {
  ALL_BUSINESS_NICHE_ROWS,
  BUSINESS_REGISTRY_GROUPS,
  type BusinessNicheRow,
  type BusinessRegistryGroup,
} from './businessRegistry.data';

export type { BusinessNicheRow, BusinessRegistryGroup };
export { ALL_BUSINESS_NICHE_ROWS, BUSINESS_REGISTRY_GROUPS };

const byId = new Map<string, BusinessNicheRow>(
  ALL_BUSINESS_NICHE_ROWS.map((r) => [r.id, r])
);

export function getBusinessNicheById(id: string | null | undefined): BusinessNicheRow | undefined {
  if (!id) return undefined;
  return byId.get(id);
}

export function searchBusinessNiches(query: string): BusinessNicheRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_BUSINESS_NICHE_ROWS;
  return ALL_BUSINESS_NICHE_ROWS.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      r.labelHi.includes(query) ||
      r.id.toLowerCase().includes(q)
  );
}

export function getNichesForGroup(groupId: string): BusinessNicheRow[] {
  return ALL_BUSINESS_NICHE_ROWS.filter((r) => r.groupId === groupId);
}

/** Map BusinessCategory → primary industry group for customer search & filtering. */
export const PRIMARY_INDUSTRY_GROUP: Record<BusinessCategory, string> = {
  // Beauty & Grooming
  mens_salon: 'beauty',
  ladies_parlour: 'beauty',
  unisex_salon: 'beauty',
  spa_center: 'beauty',
  nail_studio: 'beauty',
  mehndi_artist: 'beauty',
  tattoo_studio: 'beauty',
  massage_therapy: 'beauty',
  acupuncture_clinic: 'beauty',
  makeup_artist: 'beauty',
  bridal_studio: 'beauty',
  threading_waxing: 'beauty',
  skin_care_clinic: 'beauty',
  hair_transplant: 'beauty',
  laser_studio: 'beauty',
  ayurveda_beauty: 'beauty',
  slimming_studio: 'beauty',
  home_salon: 'beauty',

  // Healthcare
  general_clinic: 'healthcare',
  dental_clinic: 'healthcare',
  eye_clinic: 'healthcare',
  pediatric_clinic: 'healthcare',
  ortho_physio: 'healthcare',
  diagnostic_lab: 'healthcare',
  hospital_opd: 'healthcare',

  // Govt & Public
  govt_passport: 'govt',
  govt_aadhaar: 'govt',
  govt_rto: 'govt',
  govt_court: 'govt',

  // Banking
  bank_branch: 'banking',

  // Dining
  restaurant: 'dining',
  qsr_street_food: 'dining',

  // Spiritual
  temple_shrine: 'spiritual',

  // Fitness
  gym_fitness: 'fitness',

  // Pets
  pet_clinic: 'pets',
  pet_grooming: 'pets',

  // Education & Pro
  coaching_center: 'education',
  ca_tax_office: 'education',
  lawyer_notary: 'education',
  astrologer: 'education',

  // Retail & Repairs
  optical_shop: 'repairs',
  tailor_boutique: 'repairs',
  vehicle_service: 'repairs',
  phone_repair: 'repairs',
  laundry: 'repairs',
  photo_studio: 'repairs',
};

/** Resolve Firestore industry section for filters (niche wins; else template fallback). */
export function getIndustryGroupIdForBusiness(
  businessType: BusinessCategory,
  nicheId?: string | null
): string {
  if (nicheId) {
    const n = getBusinessNicheById(nicheId);
    if (n) return n.groupId;
  }
  return PRIMARY_INDUSTRY_GROUP[businessType] || 'beauty';
}

export type IndustryVisualStyle =
  | 'glass-neon'
  | 'glass-warm'
  | 'glass-luxury'
  | 'mesh-aurora'
  | 'clay-soft'
  | 'minimal-pro';

export function getVisualStyleForTemplate(t: BusinessCategory): IndustryVisualStyle {
  switch (t) {
    case 'mens_salon':
    case 'unisex_salon':
    case 'hair_transplant':
    case 'laser_studio':
    case 'tattoo_studio':
    case 'phone_repair':
    case 'vehicle_service':
      return 'glass-neon';
    case 'ladies_parlour':
    case 'makeup_artist':
    case 'bridal_studio':
    case 'threading_waxing':
    case 'mehndi_artist':
    case 'nail_studio':
    case 'home_salon':
    case 'tailor_boutique':
    case 'photo_studio':
      return 'glass-luxury';
    case 'general_clinic':
    case 'dental_clinic':
    case 'eye_clinic':
    case 'pediatric_clinic':
    case 'ortho_physio':
    case 'diagnostic_lab':
    case 'hospital_opd':
    case 'bank_branch':
    case 'govt_passport':
    case 'govt_aadhaar':
    case 'govt_rto':
    case 'govt_court':
      return 'minimal-pro';
    case 'spa_center':
    case 'massage_therapy':
    case 'acupuncture_clinic':
    case 'skin_care_clinic':
    case 'ayurveda_beauty':
    case 'slimming_studio':
    case 'temple_shrine':
      return 'mesh-aurora';
    default:
      return 'minimal-pro';
  }
}
