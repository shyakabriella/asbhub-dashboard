// src/pages/PropertyPage/property.constants.js

export const PROPERTY_TYPES = [
  "Hotel",
  "Motel",
  "Guest House",
  "Apartment",
  "Villa",
  "Resort",
  "Lodge",
  "Hostel",
  "Other",
];

export const STAR_RATINGS = ["", "1", "2", "3", "4", "5"];

export const COUNTRIES = ["Rwanda", "Uganda", "Kenya", "Tanzania", "Burundi"];

export const ONBOARDING_STAGES = [
  "Draft",
  "Contacted",
  "Documents Pending",
  "Onboarding",
  "Live",
  "Inactive",
];

export const OTA_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Paused",
];

export const SEO_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Paused",
];

export const SERVICE_OPTIONS = [
  "OTA Listing",
  "SEO",
  "Website Development",
  "Booking Engine",
  "Channel Manager",
  "PMS",
  "Content / Photos",
  "Digital Marketing",
  "Analytics",
  "Support",
];

// ✅ Factory function (fresh object every time)
export const createEmptyForm = () => ({
  // logo fields (important for edit mode + uploads)
  logo: "",
  logoFile: null,
  removeLogo: false,

  propertyName: "",
  propertyType: "Hotel",
  starRating: "",

  contactPerson: "",
  phone: "",
  email: "",

  country: "Rwanda",
  city: "",
  address: "",

  onboardingStage: "Draft",
  otaStatus: "Not Started",
  seoStatus: "Not Started",

  services: [],
  notes: "",
});

// Optional local sample data (not used by API version, but safe to keep)
export const initialProperties = [
  {
    id: 1,
    propertyName: "Kigali Heights Hotel",
    propertyType: "Hotel",
    starRating: "4",
    contactPerson: "Jean Claude",
    phone: "+250 788 000 111",
    email: "info@kigaliheights.com",
    country: "Rwanda",
    city: "Kigali",
    address: "KG 7 Ave",
    onboardingStage: "Onboarding",
    otaStatus: "In Progress",
    seoStatus: "Not Started",
    services: ["OTA Listing", "SEO", "Digital Marketing"],
    notes: "Waiting for final room photos and rate plan.",
    createdAt: new Date().toISOString(),
  },
];