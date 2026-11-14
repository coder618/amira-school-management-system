import { APP_CONFIG } from '../../app/config';

/**
 * Validates Bangladeshi 11-digit mobile phone numbers:
 * Starts with 01 followed by 3-9 and 8 more digits (e.g. 01712345678).
 */
export const isValidBdPhoneNumber = (phone: string): boolean => {
  return APP_CONFIG.REGEX.BD_PHONE.test(phone.trim());
};

/**
 * Formats a numeric value into Bangladeshi Taka (BDT ৳) currency string.
 */
export const formatBdtCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace('BDT', '৳');
};

