import { z } from 'zod';

// Enhanced spare part form schema with comprehensive validation
export const sparePartFormSchema = z.object({
  customer_name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\u0600-\u06FF\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and Arabic characters'),
  
  phone_number: z.string()
    .min(8, 'Phone number must be at least 8 characters')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Please enter a valid phone number')
    .transform(val => val.replace(/\s/g, '')), // Remove spaces
  
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .refine(email => !email.includes('..'), 'Email cannot contain consecutive dots')
    .refine(email => !email.startsWith('.') && !email.endsWith('.'), 'Email cannot start or end with a dot'),
  
  vehicle_estamra: z.string()
    .min(3, 'Vehicle registration must be at least 3 characters')
    .max(20, 'Vehicle registration must be less than 20 characters')
    .regex(/^[A-Z0-9\u0600-\u06FF\s\-]+$/i, 'Vehicle registration can only contain letters, numbers, spaces, and hyphens')
    .transform(val => val.toUpperCase().trim()),
  
  vin_number: z.string()
    .length(17, 'VIN number must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'VIN number contains invalid characters (no I, O, Q allowed)')
    .transform(val => val.toUpperCase()),
  
  part_name: z.string()
    .min(3, 'Part description must be at least 3 characters')
    .max(500, 'Part description must be less than 500 characters')
    .refine(val => val.trim().length > 0, 'Part description cannot be empty')
});

// Payment validation schema
export const paymentSchema = z.object({
  parts_cost: z.number()
    .min(0.01, 'Parts cost must be greater than 0')
    .max(50000, 'Parts cost cannot exceed 50,000 SAR')
    .multipleOf(0.01, 'Parts cost must be rounded to 2 decimal places'),
  
  freight_cost: z.number()
    .min(0, 'Freight cost cannot be negative')
    .max(5000, 'Freight cost cannot exceed 5,000 SAR')
    .multipleOf(0.01, 'Freight cost must be rounded to 2 decimal places'),
  
  customer_email: z.string().email('Valid email is required for payment'),
  order_id: z.string().min(1, 'Order ID is required'),
}).refine(data => (data.parts_cost + data.freight_cost) <= 50000, {
  message: 'Total cost cannot exceed 50,000 SAR',
  path: ['total_cost']
});

// User login validation
export const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters')
});

// User registration/profile validation
export const userProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\u0600-\u06FF\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  
  role: z.enum(['admin', 'manager', 'agent'], {
    errorMap: () => ({ message: 'Role must be admin, manager, or agent' })
  }),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .optional()
});

// File validation
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid image file (JPEG, PNG, or WebP)'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB'
    };
  }
  
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'File name is too long'
    };
  }
  
  return { valid: true };
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
};

// Validate VIN number with checksum
export const validateVIN = (vin: string): { valid: boolean; error?: string } => {
  if (vin.length !== 17) {
    return { valid: false, error: 'VIN must be exactly 17 characters' };
  }
  
  const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
  if (!vinPattern.test(vin)) {
    return { valid: false, error: 'VIN contains invalid characters' };
  }
  
  // VIN checksum validation (simplified)
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const vinValues: { [key: string]: number } = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
  };
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    if (i === 8) continue; // Skip check digit position
    const char = vin.charAt(i).toUpperCase();
    const value = vinValues[char];
    if (value === undefined) {
      return { valid: false, error: 'Invalid character in VIN' };
    }
    sum += value * weights[i];
  }
  
  const checkDigit = sum % 11;
  const expectedCheckChar = checkDigit === 10 ? 'X' : checkDigit.toString();
  const actualCheckChar = vin.charAt(8).toUpperCase();
  
  if (expectedCheckChar !== actualCheckChar) {
    return { valid: false, error: 'Invalid VIN checksum' };
  }
  
  return { valid: true };
};

// Rate limiting validation
export const rateLimitSchema = z.object({
  ip: z.string().ip(),
  endpoint: z.string(),
  timestamp: z.number(),
  count: z.number().min(0)
});

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().optional()
});

// Search/filter validation
export const searchFilterSchema = z.object({
  search: z.string().max(100, 'Search term too long').optional(),
  status: z.enum(['all', 'Pending', 'Available', 'Not Available', 'Payment Sent', 'Paid', 'Processing', 'Dispatched']).optional(),
  payment_status: z.enum(['all', 'Pending', 'Paid', 'Failed']).optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  sort_by: z.enum(['timestamp', 'customer_name', 'status', 'price']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).max(1000).optional(),
  limit: z.number().min(1).max(100).optional()
});

// Error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public code?: string,
    public severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

// Security utilities
export const securityUtils = {
  // Check for common SQL injection patterns
  detectSQLInjection: (input: string): boolean => {
    const sqlPatterns = [
      /'|;|--|union|select|insert|update|delete|drop|create|alter|exec|execute/i,
      /%27|%6F|%4F|%72|%52/i,
      /script|javascript|vbscript/i
    ];
    return sqlPatterns.some(pattern => pattern.test(input));
  },

  // Check for XSS patterns
  detectXSS: (input: string): boolean => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript\s*:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];
    return xssPatterns.some(pattern => pattern.test(input));
  },

  // Validate request origin
  validateOrigin: (origin: string, allowedOrigins: string[]): boolean => {
    return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  },

  // Generate secure token
  generateSecureToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Hash sensitive data
  hashSensitiveData: async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
};

// Performance validation
export const performanceValidation = {
  // Validate request size
  validateRequestSize: (data: any, maxSizeKB: number = 1024): { valid: boolean; error?: string } => {
    const size = new Blob([JSON.stringify(data)]).size;
    const sizeKB = size / 1024;
    
    if (sizeKB > maxSizeKB) {
      return {
        valid: false,
        error: `Request size (${sizeKB.toFixed(2)}KB) exceeds limit (${maxSizeKB}KB)`
      };
    }
    
    return { valid: true };
  },

  // Validate array lengths
  validateArrayLength: (array: any[], maxLength: number, fieldName: string): { valid: boolean; error?: string } => {
    if (array.length > maxLength) {
      return {
        valid: false,
        error: `${fieldName} cannot contain more than ${maxLength} items`
      };
    }
    return { valid: true };
  }
};

export type SparePartFormData = z.infer<typeof sparePartFormSchema>;
export type PaymentData = z.infer<typeof paymentSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UserProfileData = z.infer<typeof userProfileSchema>;
export type SearchFilterData = z.infer<typeof searchFilterSchema>;
