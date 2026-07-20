// Philippine-flavored sample data pools. All names are fictional and every
// generated record is explicitly marked as sample data.

export const FIRST_NAMES = [
  "Juan", "Maria", "Jose", "Ana", "Ramon", "Liza", "Carlo", "Grace",
  "Paolo", "Rosa", "Marco", "Teresa", "Andres", "Clarisse", "Nathan", "Bea",
];

export const LAST_NAMES = [
  "Dela Cruz", "Santos", "Reyes", "Garcia", "Mendoza", "Aquino", "Villanueva",
  "Ramos", "Bautista", "Navarro", "Domingo", "Salazar", "Torres", "Fernandez",
];

export const BUSINESS_PREFIX = [
  "Subic Bay", "Olongapo", "Zambales", "Bataan", "Kalayaan", "Mabuhay",
  "San Roque", "Rizal Avenue", "Gordon Heights", "Barretto", "Central Luzon",
  "Pamilya", "Bayanihan", "Luzviminda",
];

export const BUSINESS_SUFFIX = [
  "Trading", "Enterprises", "Ventures", "Corporation", "Marketing",
  "Solutions", "Services", "Commercial", "Group", "Merchants",
];

export const CITIES = [
  { city: "Olongapo City", province: "Zambales" },
  { city: "Subic", province: "Zambales" },
  { city: "Iba", province: "Zambales" },
  { city: "Balanga City", province: "Bataan" },
  { city: "Dinalupihan", province: "Bataan" },
  { city: "San Fernando", province: "Pampanga" },
  { city: "Angeles City", province: "Pampanga" },
  { city: "Quezon City", province: "Metro Manila" },
  { city: "Makati City", province: "Metro Manila" },
];

export const BARANGAYS = [
  "Barangay Barretto", "Barangay East Tapinac", "Barangay Gordon Heights",
  "Barangay Pag-asa", "Barangay Sta. Rita", "Barangay New Cabalan",
  "Barangay Kalaklan", "Barangay West Bajac-Bajac",
];

export const PAYMENT_METHODS = ["Cash", "GCash", "Bank transfer", "Card"];

/** Deterministic pseudo-random pick so demo data is stable between loads. */
export function pick<T>(pool: T[], seed: number): T {
  return pool[Math.abs(seed * 2654435761) % pool.length];
}

export function personName(seed: number): string {
  return `${pick(FIRST_NAMES, seed)} ${pick(LAST_NAMES, seed + 3)} (Sample)`;
}

export function businessName(seed: number): string {
  return `${pick(BUSINESS_PREFIX, seed)} ${pick(BUSINESS_SUFFIX, seed + 5)} (Sample)`;
}

export function phPhone(seed: number): string {
  const n = Math.abs((seed + 7) * 48271) % 10000000;
  return `0917 ${String(100 + (seed % 900)).padStart(3, "0")} ${String(n % 10000).padStart(4, "0")}`;
}

export function phAddress(seed: number): string {
  const loc = pick(CITIES, seed);
  return `${pick(BARANGAYS, seed + 1)}, ${loc.city}, ${loc.province}`;
}

export function pesos(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Dates spread over the recent past, deterministic per seed. */
export function recentDate(seed: number, spreadDays = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - (Math.abs(seed * 31) % spreadDays));
  return d.toISOString().slice(0, 10);
}

export function futureDate(seed: number, spreadDays = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + 1 + (Math.abs(seed * 17) % spreadDays));
  return d.toISOString().slice(0, 10);
}
