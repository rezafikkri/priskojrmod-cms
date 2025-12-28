import { baseConfig } from './base';

export const cmsConfig = {
  ...baseConfig,
  pagination: {
    pageSize: 30,
  },
  search: {
    limit: 50,
  },
  product: {
    pinnedLimit: 4,
  },
  defaults: {
    language: 'id', // supported: id, en
    currency: 'IDR', // supported: IDR, USD
  },
};
