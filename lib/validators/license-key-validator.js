import { z } from 'zod';
import { secretKeyIdSchema } from './secret-key-validator';
import { licenseIdSchema } from './license-validator';

export const createLicenseKeySchema = z.object({
  secret_key_id: z.coerce.bigint().gte(1, { message: 'Please select an option' }),
  customer_id: z.string().uuid({ message: 'Please select an option' }),
  type: z.enum(['online', 'offline']),
});

export const licenseKeyIdSchema = z.string().uuid();
export const licenseKeyIdsSchema = z.array(licenseIdSchema).min(1);

export const editLicenseKeySchema = createLicenseKeySchema
  .omit({ secret_key_id: true, customer_id: true })
  .extend({
    id: licenseKeyIdSchema,
    // old_key: z.string().min(100),
    // old_secret_key_id: z.coerce.bigint().gte(1),
    used_for_activate: z.boolean(),
    used_for_download: z.boolean(),
    change_expiration_date: z.boolean(),
  });

export const filtersSchema = z.object({
  secret_key_id: secretKeyIdSchema.optional(),
  can_regenerate: z.boolean().optional(),
}).optional();
