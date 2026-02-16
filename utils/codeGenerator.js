import { nanoid } from 'nanoid';

/**
 * Generate a unique short code for tracking links
 * Using nanoid for URL-safe, short unique IDs
 */
export const generateUniqueCode = () => {
  // Generate 8-character URL-safe unique code
  return nanoid(8);
};
