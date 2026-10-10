import { env } from '../config/env';

export const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '₹0';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '₹0';
  return `₹${num.toFixed(0)}`;
};

export const formatDecimalPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '₹0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toFixed(2)}`;
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  // strip trailing /api or /api/shop from apiUrl to get the bare origin
  const origin = env.apiUrl.replace(/\/api(\/shop)?\/?$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\s/g, '');
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
