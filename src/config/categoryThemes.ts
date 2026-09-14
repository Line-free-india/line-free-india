import { BusinessCategory } from '../store/AppContext';

export interface CategoryTheme {
  /** Primary gradient from-to colors for headers */
  gradient: string;
  /** Background radial gradient */
  bgGradient: string;
  /** Primary accent color class (e.g. 'blue-400') */
  accent: string;
  /** Hex code for dynamic styles (e.g. '#3B82F6') */
  accentColor: string;
  /** Lighter accent for borders/badges */
  accentLight: string;
  /** Button/CTA color */
  btnBg: string;
  btnText: string;
  /** Status card gradient */
  statusOpen: string;
  /** Unique greeting for this business type */
  greeting: string;
  /** What is the owner called */
  ownerTitle: string;
  /** Dashboard title */
  dashTitle: string;
  /** Queue or booking terminology */
  queueLabel: string;
  /** Action button label */
  actionLabel: string;
}

const BLUE_NEON = {
  gradient: 'from-blue-600 to-indigo-700',
  bgGradient: 'from-blue-900/40 via-background to-background',
  accent: 'text-blue-400',
  accentColor: '#60A5FA',
  accentLight: 'border-blue-500/30 bg-blue-500/10',
  btnBg: 'bg-blue-600',
  btnText: 'text-white',
  statusOpen: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
};

const PINK_LUXURY = {
  gradient: 'from-pink-500 to-fuchsia-600',
  bgGradient: 'from-pink-900/40 via-background to-background',
  accent: 'text-pink-400',
  accentColor: '#F472B6',
  accentLight: 'border-pink-500/30 bg-pink-500/10',
  btnBg: 'bg-pink-600',
  btnText: 'text-white',
  statusOpen: 'from-pink-500/20 to-fuchsia-500/10 border-pink-500/30',
};

const PURPLE_AURORA = {
  gradient: 'from-purple-500 to-violet-600',
  bgGradient: 'from-purple-900/40 via-background to-background',
  accent: 'text-purple-400',
  accentColor: '#C084FC',
  accentLight: 'border-purple-500/30 bg-purple-500/10',
  btnBg: 'bg-purple-600',
  btnText: 'text-white',
  statusOpen: 'from-purple-500/20 to-violet-500/10 border-purple-500/30',
};

const EMERALD_HEALTHCARE = {
  gradient: 'from-emerald-600 to-teal-700',
  bgGradient: 'from-emerald-950/40 via-background to-background',
  accent: 'text-emerald-400',
  accentColor: '#34D399',
  accentLight: 'border-emerald-500/30 bg-emerald-500/10',
  btnBg: 'bg-emerald-600',
  btnText: 'text-white',
  statusOpen: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
};

const AMBER_GOVT = {
  gradient: 'from-amber-600 to-orange-700',
  bgGradient: 'from-amber-950/40 via-background to-background',
  accent: 'text-amber-400',
  accentColor: '#FBBF24',
  accentLight: 'border-amber-500/30 bg-amber-500/10',
  btnBg: 'bg-amber-600',
  btnText: 'text-white',
  statusOpen: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
};

export const CATEGORY_THEMES: Record<BusinessCategory, CategoryTheme> = {
  // Beauty & Grooming
  mens_salon: { ...BLUE_NEON, greeting: '💈 Welcome, Boss!', ownerTitle: 'Barber', dashTitle: 'Salon Command', queueLabel: 'Queue', actionLabel: 'Next Customer →' },
  unisex_salon: { ...BLUE_NEON, greeting: '✂️ Welcome, Stylist!', ownerTitle: 'Stylist', dashTitle: 'Style Hub', queueLabel: 'Queue', actionLabel: 'Next Client →' },
  hair_transplant: { ...BLUE_NEON, greeting: '👨⚕️ Welcome, Doc!', ownerTitle: 'Surgeon', dashTitle: 'Clinic Dashboard', queueLabel: 'Consults', actionLabel: 'Next Consult →' },
  laser_studio: { ...BLUE_NEON, greeting: '⚡ Laser Station Active!', ownerTitle: 'Specialist', dashTitle: 'Laser HQ', queueLabel: 'Sessions', actionLabel: 'Start Session →' },
  tattoo_studio: { ...BLUE_NEON, greeting: '🖊️ Inked & Ready!', ownerTitle: 'Artist', dashTitle: 'Ink Studio', queueLabel: 'Sessions', actionLabel: 'Start Ink →' },

  ladies_parlour: { ...PINK_LUXURY, greeting: '💅 Welcome, Gorgeous!', ownerTitle: 'Manager', dashTitle: 'Beauty Studio', queueLabel: 'Clients', actionLabel: 'Next Client →' },
  makeup_artist: { ...PINK_LUXURY, greeting: '🖌️ Artistry in Progress!', ownerTitle: 'Artist', dashTitle: 'Makeup HQ', queueLabel: 'Bookings', actionLabel: 'Next Glow →' },
  bridal_studio: { ...PINK_LUXURY, greeting: '💍 The Big Day Hub!', ownerTitle: 'Curator', dashTitle: 'Bridal Center', queueLabel: 'Brides', actionLabel: 'Consult Bride →' },
  threading_waxing: { ...PINK_LUXURY, greeting: '✨ Precision Studio!', ownerTitle: 'Expert', dashTitle: 'Skin Hub', queueLabel: 'Queue', actionLabel: 'Next One →' },
  mehndi_artist: { ...PINK_LUXURY, greeting: '🎨 Patterns & Art!', ownerTitle: 'Artist', dashTitle: 'Mehndi HQ', queueLabel: 'Appointments', actionLabel: 'Start Art →' },
  nail_studio: { ...PINK_LUXURY, greeting: '💅 Nail Perfection!', ownerTitle: 'Technician', dashTitle: 'Nail Bar', queueLabel: 'Queue', actionLabel: 'Next Nails →' },
  home_salon: { ...PINK_LUXURY, greeting: '🏠 Mobile Beauty Active!', ownerTitle: 'Expert', dashTitle: 'Home Service', queueLabel: 'Visits', actionLabel: 'Go to Client →' },

  spa_center: { ...PURPLE_AURORA, greeting: '🧖 Zen Mode On!', ownerTitle: 'Therapist', dashTitle: 'Wellness HQ', queueLabel: 'Sessions', actionLabel: 'Start Zen →' },
  massage_therapy: { ...PURPLE_AURORA, greeting: '💆 Healing Hands!', ownerTitle: 'Therapist', dashTitle: 'Massage Hub', queueLabel: 'Sessions', actionLabel: 'Next Client →' },
  acupuncture_clinic: { ...PURPLE_AURORA, greeting: '🩹 Balance Restored!', ownerTitle: 'Doctor', dashTitle: 'Healing Center', queueLabel: 'Sessions', actionLabel: 'Next Visit →' },
  skin_care_clinic: { ...PURPLE_AURORA, greeting: '🧴 Radiant Skin HQ!', ownerTitle: 'Dermatologist', dashTitle: 'Skin Care', queueLabel: 'Consults', actionLabel: 'Next Treatment →' },
  ayurveda_beauty: { ...PURPLE_AURORA, greeting: '🌿 Ancient Wisdom!', ownerTitle: 'Vaidya', dashTitle: 'Ayurveda Hub', queueLabel: 'Consults', actionLabel: 'Next Veda →' },
  slimming_studio: { ...PURPLE_AURORA, greeting: '⚖️ Transformation Hub!', ownerTitle: 'Coach', dashTitle: 'Slimming HQ', queueLabel: 'Sessions', actionLabel: 'Next Goal →' },

  // Healthcare
  general_clinic: { ...EMERALD_HEALTHCARE, greeting: '🏥 OPD Queue Active', ownerTitle: 'Doctor', dashTitle: 'Clinic OPD Manager', queueLabel: 'Patients', actionLabel: 'Call Patient →' },
  dental_clinic: { ...EMERALD_HEALTHCARE, greeting: '🦷 Dental Chair Ready', ownerTitle: 'Dentist', dashTitle: 'Dental Practice', queueLabel: 'Patients', actionLabel: 'Next Patient →' },
  eye_clinic: { ...EMERALD_HEALTHCARE, greeting: '👁️ Vision Clinic Active', ownerTitle: 'Ophthalmologist', dashTitle: 'Eye Clinic Desk', queueLabel: 'Queue', actionLabel: 'Next Checkup →' },
  pediatric_clinic: { ...EMERALD_HEALTHCARE, greeting: '👶 Child Care OPD', ownerTitle: 'Pediatrician', dashTitle: 'Pediatric Clinic', queueLabel: 'Kids Queue', actionLabel: 'Next Patient →' },
  ortho_physio: { ...EMERALD_HEALTHCARE, greeting: '🦴 Therapy Session Ready', ownerTitle: 'Physio', dashTitle: 'Physio Rehab', queueLabel: 'Sessions', actionLabel: 'Call Next →' },
  diagnostic_lab: { ...EMERALD_HEALTHCARE, greeting: '🧪 Lab Samples Station', ownerTitle: 'Pathologist', dashTitle: 'Lab Queue Desk', queueLabel: 'Samples', actionLabel: 'Next Sample →' },
  hospital_opd: { ...EMERALD_HEALTHCARE, greeting: '🏨 Hospital OPD Desks', ownerTitle: 'Reception', dashTitle: 'Hospital OPD Command', queueLabel: 'Patients', actionLabel: 'Next Token →' },

  // Government
  govt_passport: { ...AMBER_GOVT, greeting: '🛂 Passport Verification', ownerTitle: 'Officer', dashTitle: 'Passport Counter', queueLabel: 'Applicants', actionLabel: 'Call Applicant →' },
  govt_aadhaar: { ...AMBER_GOVT, greeting: '🪪 Aadhaar Enrollment Station', ownerTitle: 'Operator', dashTitle: 'Aadhaar Center', queueLabel: 'Citizens', actionLabel: 'Call Citizen →' },
  govt_rto: { ...AMBER_GOVT, greeting: '🚗 RTO Counter Station', ownerTitle: 'Inspector', dashTitle: 'RTO Office Desk', queueLabel: 'Applicants', actionLabel: 'Next Token →' },
  govt_court: { ...AMBER_GOVT, greeting: '⚖️ Registrar Chamber Active', ownerTitle: 'Registrar', dashTitle: 'Court Registry', queueLabel: 'Cases', actionLabel: 'Call Next →' },

  // Banking
  bank_branch: { ...BLUE_NEON, greeting: '🏦 Teller & Service Desk', ownerTitle: 'Branch Manager', dashTitle: 'Bank Queue Manager', queueLabel: 'Tokens', actionLabel: 'Next Customer →' },

  // Food
  restaurant: { ...AMBER_GOVT, greeting: '🍽️ Dining Floor Active', ownerTitle: 'Host', dashTitle: 'Table Waitlist Manager', queueLabel: 'Waitlist', actionLabel: 'Seat Next Party →' },
  qsr_street_food: { ...AMBER_GOVT, greeting: '🍔 Food Counter Live', ownerTitle: 'Counter Lead', dashTitle: 'Express Orders', queueLabel: 'Orders', actionLabel: 'Order Ready →' },

  // Spiritual
  temple_shrine: { ...AMBER_GOVT, greeting: '🛕 Darshan Flow Active', ownerTitle: 'Sevadar', dashTitle: 'Darshan Queue Desk', queueLabel: 'Devotees', actionLabel: 'Call Next Group →' },

  // Fitness
  gym_fitness: { ...BLUE_NEON, greeting: '💪 Fitness Floor Active', ownerTitle: 'Head Trainer', dashTitle: 'Gym Workout Slots', queueLabel: 'Members', actionLabel: 'Next Member →' },

  // Pets
  pet_clinic: { ...EMERALD_HEALTHCARE, greeting: '🐾 Veterinary Station Ready', ownerTitle: 'Vet Doctor', dashTitle: 'Pet Clinic OPD', queueLabel: 'Pets', actionLabel: 'Next Pet →' },
  pet_grooming: { ...PURPLE_AURORA, greeting: '🐕 Grooming Station Ready', ownerTitle: 'Pet Groomer', dashTitle: 'Grooming Salon', queueLabel: 'Pets', actionLabel: 'Next Grooming →' },

  // Education
  coaching_center: { ...BLUE_NEON, greeting: '📚 Faculty Doubt Desk', ownerTitle: 'Faculty', dashTitle: 'Doubt Room Desk', queueLabel: 'Students', actionLabel: 'Next Student →' },
  ca_tax_office: { ...BLUE_NEON, greeting: '📊 Tax Consultation Desk', ownerTitle: 'CA', dashTitle: 'Tax Office Portal', queueLabel: 'Clients', actionLabel: 'Next Client →' },
  lawyer_notary: { ...AMBER_GOVT, greeting: '⚖️ Legal Office Chamber', ownerTitle: 'Advocate', dashTitle: 'Legal Chamber', queueLabel: 'Clients', actionLabel: 'Next Appointment →' },
  astrologer: { ...PURPLE_AURORA, greeting: '🔮 Kundali Consultation', ownerTitle: 'Pandit Ji', dashTitle: 'Astrology Portal', queueLabel: 'Seekers', actionLabel: 'Next Seeker →' },

  // Retail & Repairs
  optical_shop: { ...BLUE_NEON, greeting: '👓 Optical Testing Bay', ownerTitle: 'Optometrist', dashTitle: 'Optical Store', queueLabel: 'Customers', actionLabel: 'Next Test →' },
  tailor_boutique: { ...PINK_LUXURY, greeting: '🧵 Designer Fitting Room', ownerTitle: 'Master Tailor', dashTitle: 'Boutique Studio', queueLabel: 'Clients', actionLabel: 'Next Fitting →' },
  vehicle_service: { ...BLUE_NEON, greeting: '🔧 Service Bay Active', ownerTitle: 'Service Advisor', dashTitle: 'Garage Command', queueLabel: 'Vehicles', actionLabel: 'Next Vehicle →' },
  phone_repair: { ...BLUE_NEON, greeting: '📱 Repair Desk Ready', ownerTitle: 'Technician', dashTitle: 'Electronics Workshop', queueLabel: 'Devices', actionLabel: 'Next Device →' },
  laundry: { ...BLUE_NEON, greeting: '👔 Laundry Counter Active', ownerTitle: 'Manager', dashTitle: 'Dry Cleaning Hub', queueLabel: 'Orders', actionLabel: 'Next Drop-off →' },
  photo_studio: { ...PURPLE_AURORA, greeting: '📸 Studio Light Active', ownerTitle: 'Photographer', dashTitle: 'Photo Studio Desk', queueLabel: 'Shoots', actionLabel: 'Next Shoot →' },
};

export const getCategoryTheme = (cat: BusinessCategory): CategoryTheme =>
  CATEGORY_THEMES[cat] || CATEGORY_THEMES.mens_salon;
