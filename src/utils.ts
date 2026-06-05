import { ServiceItem } from './types';

// Default Indian CSC Services & Rates
export const DEFAULT_SERVICES: ServiceItem[] = [
  { id: 'srv_pan', name: 'NSDL PAN Card Registry', category: 'Government', govtFee: 107, custFee: 150, commission: 43 },
  { id: 'srv_voter', name: 'PVC Voter Card Print', category: 'Government', govtFee: 0, custFee: 60, commission: 60 },
  { id: 'srv_aadhaar', name: 'Aadhaar Address Update', category: 'Government', govtFee: 50, custFee: 100, commission: 50 },
  { id: 'srv_passport', name: 'New Passport Application', category: 'Government', govtFee: 1500, custFee: 1800, commission: 300 },
  { id: 'srv_cert', name: 'Income / Caste Certificate', category: 'Government', govtFee: 30, custFee: 100, commission: 70 },
  { id: 'srv_pmkisan', name: 'PM Kisan E-Kyc Sync', category: 'Government', govtFee: 15, custFee: 50, commission: 35 },
  { id: 'srv_lic', name: 'LIC Premium Payments', category: 'Insurance', govtFee: 0, custFee: 30, commission: 30 },
  { id: 'srv_recharge', name: 'Smart Mobile Recharge', category: 'Recharge', govtFee: 0, custFee: 10, commission: 10 },
  { id: 'srv_vehicle', name: 'Two-Wheeler Insurance Policy', category: 'Insurance', govtFee: 800, custFee: 1000, commission: 200 },
  { id: 'srv_birth', name: 'Birth & Death Registration', category: 'Government', govtFee: 20, custFee: 120, commission: 100 }
];

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defaultValue;
    return JSON.parse(val) as T;
  } catch (e) {
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to store key ${key}:`, e);
  }
}

// Compute detail age helper
export interface AgeDetails {
  years: number;
  months: number;
  days: number;
  nextBirthdayText: string;
  totalMonths: number;
  totalWeeks: number;
  totalDays: number;
  totalHours: number;
}

export function calculateDetailedAge(dobString: string, targetString?: string): AgeDetails | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const target = targetString ? new Date(targetString) : new Date();

  if (isNaN(dob.getTime()) || isNaN(target.getTime())) return null;
  if (dob > target) return null;

  let years = target.getFullYear() - dob.getFullYear();
  let months = target.getMonth() - dob.getMonth();
  let days = target.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    // Days in past month
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  let nextBday = new Date(target.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBday < target) {
    nextBday.setFullYear(target.getFullYear() + 1);
  }

  const diffTime = nextBday.getTime() - target.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let nextBirthdayText = '';

  if (diffDays === 365 || diffDays === 366 || diffDays === 0) {
    nextBirthdayText = "Today! 🎉 Happy Birthday!";
  } else {
    const nextBdayMonths = Math.floor(diffDays / 30.43);
    const nextBdayDaysRemaining = Math.floor(diffDays % 30.43);
    nextBirthdayText = `${diffDays} days (${nextBdayMonths} M, ${nextBdayDaysRemaining} D)`;
  }

  const totalDiffTime = target.getTime() - dob.getTime();
  const totalDays = Math.floor(totalDiffTime / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = (target.getFullYear() - dob.getFullYear()) * 12 + (target.getMonth() - dob.getMonth());
  const totalHours = totalDays * 24;

  return {
    years,
    months,
    days,
    nextBirthdayText,
    totalMonths,
    totalWeeks,
    totalDays,
    totalHours
  };
}
