import { z } from 'zod';
import { secretKeyIdSchema } from './secret-key-validator';

export const createLicenseKeySchema = z.object({
  secretKeyId: z.coerce.number().int().gte(1, { message: 'Please select an option' }),
  customerId: z.string().uuid({ message: 'Please select an option' }),
});

export const licenseKeyIdSchema = z.string().uuid();
export const licenseKeyIdsSchema = z.array(licenseKeyIdSchema).min(1);

export const editLicenseKeySchema = createLicenseKeySchema
  .omit({ secretKeyId: true, customerId: true })
  .extend({
    id: licenseKeyIdSchema,
    change_expiration_date: z.boolean(),
  });

export const filtersSchema = z.object({
  secretKeyId: secretKeyIdSchema.optional(),
  canRegenerate: z.boolean().optional(),
  isRevoked: z.boolean(),
});

export const updateLicenseKeyRevokeStatusSchema = z.object({
  id: licenseKeyIdSchema,
  isRevoked: z.boolean(),
});
