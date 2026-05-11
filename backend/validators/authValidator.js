import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export const otpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Invalid phone number')
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Invalid phone number'),
    otp: z.string().length(6, 'OTP must be 6 digits')
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(10, 'Invalid phone number').optional()
  }).refine(data => data.email || data.phone, {
    message: "Either email or phone must be provided",
    path: ["email"]
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(8, 'Password must be at least 8 characters')
  })
});
