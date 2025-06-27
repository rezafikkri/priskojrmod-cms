import { z } from 'zod';
import { contentCustomSchema } from './base-validator';
import { CurrencyCode } from '@/constants/enums';

export const createProductBasicSchema = z.object({
  name: z
    .string()
    .min(4, {
      message: 'Must contain at least 4 characters',
    })
    .max(150, { message: 'Must contain at most 150 characters' }),
  category_id: z.coerce.number().int().gte(1, {
    message: 'Please select an option',
  }),
  owner_id: z.coerce.number().int().gte(1, {
    message: 'Please select an option',
  }),
  license_id: z.coerce.number().int().gte(1, {
    message: 'Please select an option',
  }),
  download_link: z
    .union([
      z.literal(''),
      z.string()
        .url({ message: 'Must be a valid URL' })
        .max(255, { message: 'Must contain at most 255 characters' })
    ])
    .optional(),
});

export const createProductContentSchema = z.object({
  description: z.object({
    id: contentCustomSchema,
    en: contentCustomSchema,
  }),
});

const numberSchema = z
  .coerce
  .number()
  .int({ message: 'Only whole numbers are allowed' })
  .min(1, { message: 'Minimum value is 1' });

const createProductVariantSchema = z
  .object({
    name: z
      .string()
      .min(4, { message: 'Must contain at least 4 characters' })
      .max(100, { message: 'Must contain at most 100 characters' }),
    download_link: z
      .union([
        z.literal(''),
        z.string()
          .url({ message: 'Must be a valid URL' })
          .max(255, { message: 'Must contain at most 255 characters' })
      ])
      .optional(),
  });

const optionalDiscountSchema = z.union([
  z.literal(''),
  z.coerce.number().int().min(1, { message: 'Minimum value is 1' }),
]);
const optionalExpiredAtSchema = z.union([ z.literal(''), z.date(), z.number().int() ]);

export const createProductImageSchema = z.object({
  url: z
    .string()
    .url({ message: 'Must be a valid URL' })
    .max(255, { message: 'Must contain at most 255 characters' }),
  width: numberSchema,
  height: numberSchema,
  is_thumbnail: z.boolean(),
});

export const createProductExtrasSchema = z.object({
  variants: createProductVariantSchema
    .extend({
      id: z.string().uuid(),
    })
    .array()
    .min(1),
  images: createProductImageSchema.array().min(1, { message: 'At least one image is required' }),
  discount: z
    .object({
      value: optionalDiscountSchema,
      expired_at: optionalExpiredAtSchema,
    })
    .superRefine((data, ctx) => {
      const isValueEmpty = !data.value;
      const isExpiredAtEmpty = !data.expired_at;

      if (isValueEmpty && !isExpiredAtEmpty) {
        ctx.addIssue({
          path: ['value'],
          code: z.ZodIssueCode.custom,
          message: 'Can\'t be empty',
        });
      }

      if (isExpiredAtEmpty && !isValueEmpty) {
        ctx.addIssue({
          path: ['expired_at'],
          code: z.ZodIssueCode.custom,
          message: 'Can\'t be empty',
        });
      }
    })
    .optional(),
  coupon: z
    .object({
      code: z.union([ 
        z.literal(''),
        z
          .string()
          .min(2, { message: 'Must contain at least 2 characters' })
          .max(150, { message: 'Must contain at most 150 characters' }),
      ]),
      discount: optionalDiscountSchema,
      expired_at: optionalExpiredAtSchema,
    })
    .superRefine((data, ctx) => {
      const isCodeEmpty = !data.code;
      const isDiscountEmpty = !data.discount;
      const isExpiredAtEmpty = !data.expired_at;

      if (isCodeEmpty && (!isDiscountEmpty || !isExpiredAtEmpty)) {
        ctx.addIssue({
          path: ['code'],
          code: z.ZodIssueCode.custom,
          message: 'Can\'t be empty',
        });
      }

      if (isDiscountEmpty && (!isCodeEmpty || !isExpiredAtEmpty)) {
        ctx.addIssue({
          path: ['discount'],
          code: z.ZodIssueCode.custom,
          message: 'Can\'t be empty',
        });
      }

      if (isExpiredAtEmpty && (!isCodeEmpty || !isDiscountEmpty)) {
        ctx.addIssue({
          path: ['expired_at'],
          code: z.ZodIssueCode.custom,
          message: 'Can\'t be empty',
        });
      }
    })
    .optional(),
});

export const createProductPricingSchema = z.object({
  price_type: z.enum(['free', 'paid'], { message: 'Please select an option' }),
  prices: z
    .object({
      variantId: z.string(),
      variantName: z.string(),
      price: numberSchema,
      currency_code: z.enum([CurrencyCode.IDR, CurrencyCode.USD]),
    })
    .array()
    .optional(),
  is_published: z.boolean(),
});

export const createProductSchema = createProductBasicSchema
  .merge(createProductContentSchema)
  .merge(createProductPricingSchema.omit({ prices: true }))
  .merge(createProductExtrasSchema.omit({ variants: true }))
  .extend({
    variants: createProductVariantSchema
      .extend({
        prices: z
          .object({
            price: numberSchema,
            currency_code: z.enum([CurrencyCode.IDR, CurrencyCode.USD]),
          })
          .array()
          .optional(),
      })
      .array()
      .min(1),
  });

export const productIdSchema = z.string().uuid();

export const updateProductPinnedStatusSchema = z.object({
  id: productIdSchema,
  is_pinned: z.boolean(),
});

export const updateProductPublishedStatusSchema = z.object({
  id: productIdSchema,
  is_published: z.boolean(),
});
