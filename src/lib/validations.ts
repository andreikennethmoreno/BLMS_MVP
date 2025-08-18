import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Property schemas
export const propertySchema = z.object({
  title: z.string().min(1, 'Property title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: z.string().min(1, 'Address is required'),
  images: z.array(z.string().url('Please enter a valid URL')).min(1, 'At least one image is required'),
  amenities: z.array(z.string().min(1, 'Amenity cannot be empty')).min(1, 'At least one amenity is required'),
  bedrooms: z.number().min(1, 'At least 1 bedroom is required'),
  bathrooms: z.number().min(1, 'At least 1 bathroom is required'),
  maxGuests: z.number().min(1, 'At least 1 guest capacity is required'),
  proposedRate: z.number().min(1, 'Rate must be greater than 0'),
});

// Review schemas
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(10, 'Review must be at least 10 characters'),
  images: z.array(z.string().url('Please enter a valid URL')).optional(),
});

// Concern schemas
export const concernSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high']),
});

// Job order schemas
export const jobOrderSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  assignedTeam: z.string().min(1, 'Assigned team is required'),
  priority: z.enum(['low', 'medium', 'high']),
  estimatedCompletion: z.string().min(1, 'Estimated completion date is required'),
  notes: z.string().optional(),
});

// Contract template schemas
export const contractTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Description is required'),
  commissionPercentage: z.number().min(0, 'Commission must be 0 or greater').max(100, 'Commission cannot exceed 100%'),
  fields: z.array(z.object({
    id: z.string(),
    label: z.string().min(1, 'Field label is required'),
    type: z.string(),
    required: z.boolean(),
    defaultValue: z.string().optional(),
  })).min(1, 'At least one field is required'),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type ConcernFormData = z.infer<typeof concernSchema>;
export type JobOrderFormData = z.infer<typeof jobOrderSchema>;
export type ContractTemplateFormData = z.infer<typeof contractTemplateSchema>;