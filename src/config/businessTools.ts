import { BusinessCategory } from '../store/AppContext';

export interface ToolItem {
  label: string;
  icon: string;
  path: string;
  color: string; // tailwind color key like 'blue', 'rose', 'emerald'
  description?: string;
}

// ── Shared tools available to ALL business types (Clean & Focused) ──
export const SHARED_TOOLS: ToolItem[] = [
  { label: 'Live Queue Sheet', icon: '📋', path: '/barber/customers', color: 'blue', description: 'Real-time Queue' },
  { label: 'WhatsApp CRM', icon: '💬', path: '/barber/whatsapp', color: 'emerald', description: 'Auto Alerts' },
  { label: 'Staff Roster', icon: '👥', path: '/barber/staff', color: 'purple', description: 'Team Manager' },
  { label: 'Booking Calendar', icon: '📅', path: '/barber/calendar', color: 'blue', description: 'Appointments' },
  { label: 'Coupons & Promos', icon: '🎟️', path: '/barber/coupons', color: 'orange', description: 'Discounts' },
  { label: 'Loyalty Program', icon: '🏆', path: '/barber/loyalty-program', color: 'yellow', description: 'Reward Points' },
  { label: 'Analytics Pro', icon: '📈', path: '/barber/analytics-pro', color: 'emerald', description: 'Growth Trends' },
  { label: 'TV Kiosk Mode', icon: '📺', path: '/barber/tv-dashboard', color: 'blue', description: 'Counter TV' },
  { label: 'Daily Reports', icon: '📑', path: '/barber/daily-report', color: 'rose', description: 'Day Summary' },
  { label: 'Menu Editor', icon: '📝', path: '/barber/menu-editor', color: 'orange', description: 'Edit Services' },
  { label: 'Shift Planner', icon: '⏰', path: '/barber/shifts', color: 'sky', description: 'Staff Timetable' },
  { label: 'Task Manager', icon: '📌', path: '/barber/tasks', color: 'indigo', description: 'Daily To-Dos' },
  { label: 'Revenue Ops', icon: '📊', path: '/barber/revenue-ops', color: 'cyan', description: 'Real-time ROI' },
];

// ── Category-specific tool mappings ──
export const BUSINESS_TOOLS: Record<string, ToolItem[]> = {
  mens_salon: [
    { label: 'Queue', icon: '📋', path: '/barber/customers', color: 'blue', description: 'Live queue' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },
    { label: 'CRM', icon: '💼', path: '/barber/crm', color: 'purple', description: 'Client records' },

  ],
  men_salon: [
    { label: 'Queue', icon: '📋', path: '/barber/customers', color: 'blue', description: 'Live queue' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },
    { label: 'CRM', icon: '💼', path: '/barber/crm', color: 'purple', description: 'Client records' },

  ],
  ladies_parlour: [
    { label: 'Queue', icon: '📋', path: '/barber/customers', color: 'pink', description: 'Live queue' },
    { label: 'Bridal', icon: '👰', path: '/barber/bridal-package', color: 'fuchsia', description: 'Wedding packages' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },

  ],
  beauty_parlour: [
    { label: 'Queue', icon: '📋', path: '/barber/customers', color: 'pink', description: 'Live queue' },
    { label: 'Bridal', icon: '👰', path: '/barber/bridal-package', color: 'fuchsia', description: 'Wedding packages' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },

  ],
  unisex_salon: [
    { label: 'Queue', icon: '📋', path: '/barber/customers', color: 'violet', description: 'Live queue' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },
    { label: 'CRM', icon: '💼', path: '/barber/crm', color: 'purple', description: 'Client records' },

  ],
  spa_center: [
    { label: 'Bookings', icon: '📅', path: '/barber/customers', color: 'purple', description: 'Appointments' },
    { label: 'Therapists', icon: '🧖', path: '/barber/staff', color: 'pink', description: 'Therapist roster' },
    { label: 'Packages', icon: '🎁', path: '/barber/service-packages', color: 'rose', description: 'Spa packages' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },
  ],
  general_clinic: [
    { label: 'Appointments', icon: '📅', path: '/barber/clinic-appointment', color: 'blue', description: 'Patient slots' },
    { label: 'Prescriptions', icon: '💊', path: '/barber/digital-prescription', color: 'emerald', description: 'ePrescribe' },
    { label: 'Patients', icon: '🏥', path: '/barber/patient-records', color: 'sky', description: 'Health records' },
    { label: 'Vaccines', icon: '💉', path: '/barber/vaccination-tracker', color: 'teal', description: 'Immunization' },
    { label: 'Queue', icon: '📋', path: '/barber/customers', color: 'violet', description: 'OPD queue' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Patient reviews' },
  ],
  hospital_opd: [
    { label: 'OPD', icon: '🏥', path: '/barber/clinic-appointment', color: 'blue', description: 'Outpatient' },
    { label: 'Prescriptions', icon: '💊', path: '/barber/digital-prescription', color: 'emerald', description: 'ePrescribe' },
    { label: 'Lab Reports', icon: '🔬', path: '/barber/patient-records', color: 'cyan', description: 'Diagnostics' },
    { label: 'Vaccines', icon: '💉', path: '/barber/vaccination-tracker', color: 'teal', description: 'Immunizations' },
  ],
  restaurant: [
    { label: 'Menu Builder', icon: '🍽️', path: '/barber/menu-editor', color: 'red', description: 'Digital menu' },
    { label: 'Reservations', icon: '📅', path: '/barber/customers', color: 'blue', description: 'Table bookings' },
    { label: 'Catering', icon: '🍛', path: '/barber/catering', color: 'orange', description: 'Catering orders' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Guest reviews' },
  ],
  cafe: [
    { label: 'Services', icon: '📝', path: '/barber/menu-editor', color: 'amber', description: 'Services menu' },
    { label: 'Bookings', icon: '📅', path: '/barber/customers', color: 'blue', description: 'Reservations' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },
  ],
  clinic: [
    { label: 'Appointments', icon: '📅', path: '/barber/clinic-appointment', color: 'blue', description: 'Patient slots' },
    { label: 'Prescriptions', icon: '💊', path: '/barber/digital-prescription', color: 'emerald', description: 'ePrescribe' },
    { label: 'Patients', icon: '🏥', path: '/barber/patient-records', color: 'sky', description: 'Health records' },
    { label: 'Vaccines', icon: '💉', path: '/barber/vaccination-tracker', color: 'teal', description: 'Immunization' },
    { label: 'Queue', icon: '📋', path: '/barber/customers', color: 'violet', description: 'OPD queue' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Patient reviews' },
  ],
  hospital: [
    { label: 'OPD', icon: '🏥', path: '/barber/clinic-appointment', color: 'blue', description: 'Outpatient' },
    { label: 'Prescriptions', icon: '💊', path: '/barber/digital-prescription', color: 'emerald', description: 'ePrescribe' },
    { label: 'Lab Reports', icon: '🔬', path: '/barber/patient-records', color: 'cyan', description: 'Diagnostics' },
    { label: 'Blood Bank', icon: '🩸', path: '/barber/blood-bank', color: 'red', description: 'Donor registry' },
    { label: 'Vaccines', icon: '💉', path: '/barber/vaccination-tracker', color: 'teal', description: 'Immunizations' },
  ],
  gym: [
    { label: 'Members', icon: '💪', path: '/barber/customers', color: 'red', description: 'Gym members' },
    { label: 'Classes', icon: '🧘', path: '/barber/class-scheduler', color: 'violet', description: 'Group fitness' },
    { label: 'Memberships', icon: '🎫', path: '/barber/subscription', color: 'emerald', description: 'Plans & passes' },
    { label: 'Attendance', icon: '✅', path: '/barber/attendance', color: 'blue', description: 'Check-ins' },
    { label: 'Diet Plans', icon: '🥗', path: '/barber/diet-planner', color: 'lime', description: 'Nutrition' },
  ],
  spa: [
    { label: 'Bookings', icon: '📅', path: '/barber/customers', color: 'purple', description: 'Appointments' },
    { label: 'Therapists', icon: '🧖', path: '/barber/staff', color: 'pink', description: 'Therapist roster' },
    { label: 'Packages', icon: '🎁', path: '/barber/service-packages', color: 'rose', description: 'Spa packages' },
    { label: 'Room Status', icon: '🚿', path: '/barber/bay-manager', color: 'cyan', description: 'Room usage' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },
  ],
  coaching: [
    { label: 'Batches', icon: '📚', path: '/barber/batches', color: 'blue', description: 'Class batches' },
    { label: 'Students', icon: '👨‍🎓', path: '/barber/customers', color: 'indigo', description: 'Enrollments' },
    { label: 'Attendance', icon: '✅', path: '/barber/attendance', color: 'emerald', description: 'Roll call' },
    { label: 'Assignments', icon: '📝', path: '/barber/assignment-hub', color: 'violet', description: 'Homework' },
    { label: 'Mock Tests', icon: '📄', path: '/barber/mock-test', color: 'orange', description: 'Practice exams' },
    { label: 'Fee Tracker', icon: '💰', path: '/barber/fee-tracker', color: 'emerald', description: 'Fee collection' },
  ],
  pet_care: [
    { label: 'Appointments', icon: '📅', path: '/barber/customers', color: 'lime', description: 'Pet visits' },
    { label: 'Pet Records', icon: '🐾', path: '/barber/pet-health-log', color: 'emerald', description: 'Health logs' },
    { label: 'Vaccines', icon: '💉', path: '/barber/vaccination-tracker', color: 'teal', description: 'Pet vaccines' },
    { label: 'Grooming', icon: '✂️', path: '/barber/pet-grooming', color: 'pink', description: 'Bath & trim' },
    { label: 'Boarding', icon: '🏠', path: '/barber/pet-boarding', color: 'amber', description: 'Pet stay' },
  ],
  law_firm: [
    { label: 'Cases', icon: '📂', path: '/barber/case-tracker', color: 'blue', description: 'Active cases' },
    { label: 'Hearings', icon: '⚖️', path: '/barber/court-hearing', color: 'violet', description: 'Court dates' },
    { label: 'Consults', icon: '📞', path: '/barber/consultation-booking', color: 'emerald', description: 'Client calls' },
    { label: 'Billing', icon: '💰', path: '/barber/billable-hours', color: 'amber', description: 'Time billing' },
    { label: 'Clients', icon: '👥', path: '/barber/customers', color: 'indigo', description: 'Client list' },
    { label: 'Documents', icon: '📄', path: '/barber/documents', color: 'slate', description: 'Legal docs' },
  ],
  photography: [
    { label: 'Bookings', icon: '📅', path: '/barber/event-booking', color: 'blue', description: 'Shoot schedule' },
    { label: 'Portfolio', icon: '🖼️', path: '/barber/portfolio', color: 'pink', description: 'Showcase work' },
    { label: 'Gallery', icon: '📸', path: '/barber/client-gallery', color: 'violet', description: 'Client photos' },
    { label: 'Clients', icon: '👥', path: '/barber/customers', color: 'indigo', description: 'Client list' },
    { label: 'Invoices', icon: '🧾', path: '/barber/invoice-generator', color: 'emerald', description: 'Billing' },
  ],
  repair_shop: [
    { label: 'Job Cards', icon: '🔧', path: '/barber/job-card', color: 'blue', description: 'Active repairs' },
    { label: 'Spare Parts', icon: '⚙️', path: '/barber/spare-parts', color: 'orange', description: 'Parts stock' },
    { label: 'Technicians', icon: '👨‍🔧', path: '/barber/staff', color: 'indigo', description: 'Tech roster' },
    { label: 'AMC', icon: '📋', path: '/barber/amc-tracker', color: 'emerald', description: 'Service contracts' },
    { label: 'Queue', icon: '📋', path: '/barber/customers', color: 'violet', description: 'Walk-ins' },
    { label: 'Invoices', icon: '🧾', path: '/barber/invoice-generator', color: 'amber', description: 'Billing' },
  ],
  laundry: [
    { label: 'Orders', icon: '👔', path: '/barber/customers', color: 'sky', description: 'Active orders' },
    { label: 'Tracking', icon: '📦', path: '/barber/laundry-tracking', color: 'blue', description: 'Order status' },
    { label: 'Pricing', icon: '💰', path: '/barber/settings', color: 'emerald', description: 'Rate card' },
    { label: 'Delivery', icon: '🛵', path: '/barber/delivery', color: 'orange', description: 'Pickup & Drop' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },
  ],
  other: [
    { label: 'Queue', icon: '📋', path: '/barber/customers', color: 'blue', description: 'Live queue' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },
    { label: 'CRM', icon: '💼', path: '/barber/crm', color: 'purple', description: 'Client records' },
    { label: 'Invoices', icon: '🧾', path: '/barber/invoice-generator', color: 'amber', description: 'Billing' },
  ],
  event_planner: [
    { label: 'Events', icon: '🎉', path: '/barber/customers', color: 'pink', description: 'Active events' },
    { label: 'Inquiry', icon: '📞', path: '/barber/leads', color: 'blue', description: 'Leads' },
    { label: 'Packages', icon: '🎁', path: '/barber/service-packages', color: 'fuchsia', description: 'Event plans' },
    { label: 'Feedback', icon: '⭐', path: '/barber/customer-feedback', color: 'yellow', description: 'Reviews' },
    { label: 'Contracts', icon: '📄', path: '/barber/contracts', color: 'slate', description: 'Legal agreements' },
  ],
};
