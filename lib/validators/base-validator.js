import { z } from 'zod';

export const contentCustomSchema = z.intersection(
  z.string().min(1, { message: 'Can\'t be empty' }),
  z.custom((val) => {
    if (!/<p>(&nbsp;)*\s*<\/p>/.test(val)) return true;
    return false
  }, {
    message: 'Can\'t be empty',
  }),
);

export const searchKeySchema = z.string().trim().min(1).max(100);
