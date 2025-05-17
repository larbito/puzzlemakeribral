import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper to normalize image URLs to handle both local and external URLs
 */
export function normalizeUrl(url: string | null): string | null {
  if (!url) return url;
  if (url.startsWith('data:')) return url; // Don't modify data URLs
  if (url.startsWith('http')) return url;
  return `https://puzzlemakeribral-production.up.railway.app${url.startsWith('/') ? '' : '/'}${url}`;
}