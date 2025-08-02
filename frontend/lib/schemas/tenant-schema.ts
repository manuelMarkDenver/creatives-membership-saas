import { z } from 'zod'

// Define business categories enum
export const BusinessCategoryEnum = z.enum(['GYM', 'COFFEE_SHOP', 'ECOMMERCE', 'OTHER'])

// Comprehensive tenant creation schema
export const createTenantSchema = z.object({
  // Basic tenant info
  name: z.string().min(1, 'Tenant name is required').max(100, 'Name must be less than 100 characters'),
  category: BusinessCategoryEnum,
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),

  // Owner details - required
  ownerFirstName: z.string().min(1, 'Owner first name is required').max(50, 'First name must be less than 50 characters'),
  ownerLastName: z.string().min(1, 'Owner last name is required').max(50, 'Last name must be less than 50 characters'),
  ownerEmail: z.string().email('Please enter a valid email address'),
  ownerPhoneNumber: z.string().optional(),

  // Super admin options
  freeBranchOverride: z.number().min(0, 'Free branch override cannot be negative').max(10, 'Maximum 10 additional free branches'),

  // Optional tenant details
  logoUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email('Please enter a valid email address').or(z.literal('')).optional(),
  websiteUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
})

export type CreateTenantFormData = z.infer<typeof createTenantSchema>

// Default form values
export const defaultTenantValues: CreateTenantFormData = {
  name: '',
  category: 'GYM',
  description: '',
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPhoneNumber: '',
  freeBranchOverride: 0,
  logoUrl: '',
  address: '',
  phoneNumber: '',
  email: '',
  websiteUrl: '',
  primaryColor: '',
  secondaryColor: '',
}
