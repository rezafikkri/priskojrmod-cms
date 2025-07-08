import { z } from 'zod';
import { contentCustomSchema } from './base-validator';
import { CurrencyCode } from '@/constants/enums';

export const productNameSchema = z
  .string()
  .min(4, {
    message: 'Must contain at least 4 characters',
  })
  .max(150, { message: 'Must contain at most 150 characters' });

export const createProductBasicSchema = z.object({
  name: productNameSchema,
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

export const productIdSchema = z.string().uuid();

export const editProductBasicSchema = createProductBasicSchema.extend({
  id: productIdSchema,
});

export const createProductContentSchema = z.object({
  description: z.object({
    id: contentCustomSchema,
    en: contentCustomSchema,
  }),
});

export const editProductContentSchema = createProductContentSchema.extend({
  translationId: z.object({
    id: z.string().uuid(),
    en: z.string().uuid(),
  }),
  changelog: z.object({
    id: z.string(),
    en: z.string(),
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
      .min(3, { message: 'Must contain at least 4 characters' })
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

const optionalDiscountValueSchema = z.union([
  z.literal(''),
  z.coerce.number().int().min(1, { message: 'Minimum value is 1' }),
]);
const optionalExpiredAtSchema = z.union([ z.literal(''), z.date(), z.coerce.number().int() ]);
const optionalCouponCodeSchema = z.union([ 
  z.literal(''),
  z
  .string()
  .min(2, { message: 'Must contain at least 2 characters' })
  .max(150, { message: 'Must contain at most 150 characters' }),
]);

const discountSuperRefine = (data, ctx) => {
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
};
const couponSuperRefine = (data, ctx) => {
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
};

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
  images: createProductImageSchema
    .array()
    .min(1, { message: 'At least one image is required' })
    .max(10, { message: 'Maximum 10 images allowed per product' }),
});

export const productVariantIdSchema = z.string().uuid();
export const productImageIdSchema = z.string().uuid();
export const productDiscountIdSchema = z.coerce.number().int();
export const productCouponIdSchema = z.coerce.number().int();

export const editProductExtrasSchema = z.object({
  variants: createProductVariantSchema
    .extend({
      id: productVariantIdSchema.optional(),
      dbId: productVariantIdSchema.optional(),
    })
    .refine(data => data.dbId || data.id )
    .array()
    .min(1),
  images: createProductImageSchema
    .extend({
      dbId: productImageIdSchema.optional(),
    })
    .array()
    .min(1, { message: 'At least one image is required' })
    .max(10, { message: 'Maximum 10 images allowed per product' }),
});

const priceSchema = z
  .coerce
  .number()
  .int()
  .min(1, { message: 'Must be greater than zero' })
  .max(2_147_483_647, { message: 'Exceeds allowed range' });

const createProductPriceSchema = z
  .object({
    variantId: z.string().uuid(),
    variantName: z.string(),
    price: priceSchema,
    currency_code: z.enum([CurrencyCode.IDR, CurrencyCode.USD]),
  });
const createProductPriceTypeSchema = z.enum(['free', 'paid'], { message: 'Please select an option' });

export const createProductPricingSchema = z.object({
  price_type: createProductPriceTypeSchema,
  prices: createProductPriceSchema.array().optional(),
  discount: z
    .object({
      value: optionalDiscountValueSchema,
      expired_at: optionalExpiredAtSchema,
    })
    .superRefine(discountSuperRefine)
    .optional(),
  coupon: z
    .object({
      code: optionalCouponCodeSchema,
      discount: optionalDiscountValueSchema,
      expired_at: optionalExpiredAtSchema,
    })
    .superRefine(couponSuperRefine)
    .optional(),
  is_published: z.boolean(),
});

export const editProductPricingSchema = z.object({
  price_type: createProductPriceTypeSchema,
  prices: createProductPriceSchema
    .extend({
      id: z.string().uuid().optional(),
    })
    .array()
    .optional(),
  discount: z
    .object({
      id: productDiscountIdSchema.optional(),
      value: optionalDiscountValueSchema,
      expired_at: optionalExpiredAtSchema,
    })
    .superRefine(discountSuperRefine)
    .optional(),
  coupon: z
    .object({
      id: productCouponIdSchema.optional(),
      code: optionalCouponCodeSchema,
      discount: optionalDiscountValueSchema,
      expired_at: optionalExpiredAtSchema,
    })
    .superRefine(couponSuperRefine)
    .optional(),
  should_update_released_at: z.boolean(),
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
            price: priceSchema,
            currency_code: z.enum([CurrencyCode.IDR, CurrencyCode.USD]),
          })
          .array()
          .optional(),
      })
      .array()
      .min(1),
  });

export const editProductSchema = editProductBasicSchema
  .merge(editProductContentSchema)
  .merge(editProductPricingSchema.omit({ prices: true }))
  .merge(editProductExtrasSchema.omit({ variants: true }))
  .extend({
    variants: createProductVariantSchema
      .extend({
        dbId: productVariantIdSchema.optional(),
        prices: z
          .object({
            id: z.string().uuid().optional(),
            price: priceSchema,
            currency_code: z.enum([CurrencyCode.IDR, CurrencyCode.USD]),
          })
          .array()
          .optional(),
      })
      .array()
      .min(1),
  });

export const updateProductPinnedStatusSchema = z.object({
  id: productIdSchema,
  is_pinned: z.boolean(),
});

export const updateProductPublishedStatusSchema = z.object({
  id: productIdSchema,
  is_published: z.boolean(),
});
