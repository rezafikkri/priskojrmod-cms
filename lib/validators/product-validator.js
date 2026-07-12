import { z } from 'zod';
import { contentCustomSchema, currencyCodeSchema, passwordSchema } from './base-validator';
import { PriceType, ProductStatus } from '@/constants/enums';

export const productNameSchema = z
  .string()
  .min(4, {
    message: 'Must contain at least 4 characters',
  })
  .max(150, { message: 'Must contain at most 150 characters' });

const createProductPriceTypeSchema = z.enum(
  Object.values(PriceType),
  { message: 'Please select an option' },
);

export const createProductBasicSchema = z.object({
  name: productNameSchema,
  categoryId: z.coerce.number().int().gte(1, {
    message: 'Please select an option',
  }),
  ownerId: z.coerce.number().int().gte(1, {
    message: 'Please select an option',
  }),
  adminId: z.coerce.number().int().gte(1, {
    message: 'Please select an option',
  }).optional(),
  licenseId: z.coerce.number().int().gte(1, {
    message: 'Please select an option',
  }),
  priceType: createProductPriceTypeSchema,
  driveFileId: z
    .union([
      z.literal(''),
      z.string()
        .min(25, { message: 'Drive file ID is too short' })
        .regex(/^[a-zA-Z0-9_-]+$/, { message: 'Invalid Drive file ID format' }),
    ])
    .optional(),
  downloadUrl: z
    .union([
      z.literal(''),
      z.string().url({ message: 'Must be a valid URL' })
    ])
    .optional(),
  version: z
    .string()
    .min(2, { message: 'Must be at least 2 characters' })
    .max(50, { message: 'Must be at most 50 characters' }),
});

export const productIdSchema = z.string().uuid();

export const editProductBasicSchema = createProductBasicSchema.extend({
  id: productIdSchema,
  versionId: z.string().uuid(),
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
  versionTranslationId: z
    .object({
      id: z.string().uuid(),
      en: z.string().uuid(),
    })
    .optional(),
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
    downloadUrl: z
      .union([
        z.literal(''),
        z.string()
          .url({ message: 'Must be a valid URL' }),
      ])
      .optional(),
    fileAccessPassword: z
      .union([
        z.literal(''),
        passwordSchema,
      ])
      .optional(),
  });

const optionalDiscountValueSchema = z.union([
  z.literal(''),
  z.coerce.number().int().min(1, { message: 'Minimum value is 1' }),
]);
const optionalExpiredAtSchema = z.union([ z.literal(''), z.date(), z.coerce.number().int() ]);
const optionalUpgradeCouponCodeSchema = z.union([ 
  z.literal(''),
  z
    .string().trim()
    .min(2, { message: 'Must contain at least 2 characters' })
    .max(150, { message: 'Must contain at most 150 characters' }),
]);

const discountSuperRefine = (data, ctx) => {
  const isValueEmpty = !data.value;
  const isExpiredAtEmpty = !data.expiredAt;

  if (isValueEmpty && !isExpiredAtEmpty) {
    ctx.addIssue({
      path: ['value'],
      code: z.ZodIssueCode.custom,
      message: 'Can\'t be empty',
    });
  }

  if (isExpiredAtEmpty && !isValueEmpty) {
    ctx.addIssue({
      path: ['expiredAt'],
      code: z.ZodIssueCode.custom,
      message: 'Please select an expiration date',
    });
  }

  if (data.id && isValueEmpty && isExpiredAtEmpty) {
    ctx.addIssue({
      path: ['root'],
      code: z.ZodIssueCode.custom,
      message: 'Existing discount cannot be cleared',
    });
  }
};

const upgradeCouponSuperRefine = (data, ctx) => {
  const isCodeEmpty = !data.code;
  const isDiscountEmpty = !data.discount;
  const isExpiredAtEmpty = !data.expiredAt;

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
      path: ['expiredAt'],
      code: z.ZodIssueCode.custom,
      message: 'Please select an expiration date',
    });
  }

  if (data.id && isCodeEmpty && isDiscountEmpty && isExpiredAtEmpty) {
    ctx.addIssue({
      path: ['root'],
      code: z.ZodIssueCode.custom,
      message: 'Existing upgrade coupon cannot be cleared',
    });
  }
};

export const createProductImageSchema = z.object({
  url: z
    .string()
    .url({ message: 'Must be a valid URL' }),
  width: numberSchema,
  height: numberSchema,
  isThumbnail: z.boolean(),
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
export const productUpgradeCouponIdSchema = z.string().uuid();

export const editProductExtrasSchema = z.object({
  variants: createProductVariantSchema
    .extend({
      id: productVariantIdSchema.optional(),
      dbId: productVariantIdSchema.optional(),
    })
    .refine(data => data.dbId || data.id)
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
  .gte(1, { message: 'Must be greater than zero' })
  .lte(99999999.99, { message: 'Exceeds allowed range' })
  .refine(
    val => val % 1 === 0 || Number(val.toFixed(2)) === val,
    { message: 'Price must have at most 2 decimal places' },
  );

const createProductPriceSchema = z
  .object({
    variantId: z.string().uuid(),
    variantName: z.string(),
    currencies: z
      .object({
        id: z.string().uuid().optional(),
        price: priceSchema,
        currencyCode: currencyCodeSchema,
      })
      .array()
      .min(2),
  });

export const createProductPricingSchema = z.object({
  prices: createProductPriceSchema.array().optional(),
  discount: z
    .object({
      value: optionalDiscountValueSchema,
      expiredAt: optionalExpiredAtSchema,
    })
    .superRefine(discountSuperRefine)
    .optional(),
  status: z.enum(Object.values(ProductStatus)),
});

export const editProductPricingSchema = z.object({
  prices: createProductPriceSchema.array().optional(),
  discount: z
    .object({
      id: productDiscountIdSchema.optional(),
      value: optionalDiscountValueSchema,
      expiredAt: optionalExpiredAtSchema,
    })
    .superRefine(discountSuperRefine)
    .optional(),
  upgradeCoupon: z
    .object({
      id: productUpgradeCouponIdSchema.optional(),
      code: optionalUpgradeCouponCodeSchema,
      discount: optionalDiscountValueSchema,
      expiredAt: optionalExpiredAtSchema,
    })
    .superRefine(upgradeCouponSuperRefine)
    .optional(),
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
            currencyCode: currencyCodeSchema,
          })
          .array()
          .min(2)
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
            currencyCode: currencyCodeSchema,
          })
          .array()
          .min(2)
          .optional(),
      })
      .array()
      .min(1),
  });

export const productStatusSchema = z.enum(Object.values(ProductStatus));
export const isPinnedSchema = z.boolean();

export const filtersSchema = z.object({
  status: z.enum(['active', 'inactive']),
});
