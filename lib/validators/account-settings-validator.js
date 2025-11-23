import { createAdminSchema } from './admin-validator';

export const accountSettingsSchema = createAdminSchema.omit({ email: true });
