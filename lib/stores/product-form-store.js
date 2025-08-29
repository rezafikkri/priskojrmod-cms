import { v4 } from 'uuid';
import { createStore } from 'zustand/vanilla';

export const defaultInitState = {
  basic: {
    name: '',
    category_id: '',
    owner_id: '',
    license_id: '',
    price_type: '',
    drive_file_id: '',
    download_link: '',
    version: '',
  },
  content: {
    description: {
      id: '',
      en: '',
    },
  },
  extras: {
    variants: [
      {
        id: v4(),
        name: '',
        download_link: '',
        file_access_password: '',
      },
    ],
    images: [],
  },
  pricing: {
    prices: [],
    discount: {
      value: '',
      expired_at: '',
    },
    coupon: {
      code: '',
      discount: '',
      expired_at: '',
    },
    is_published: false,
  },
};

export const createProductFormStore = (initState = defaultInitState) => {
  return createStore((set) => ({
    ...initState,
    setBasic: (data) => set(state => ({ ...state, basic: data })),
    setContent: (data) => set(state => ({ ...state, content: data })),
    setExtras: (data) => set(state => ({ ...state, extras: data })),
    setPricing: (data) => set(state => ({ ...state, pricing: data })),
    setVersionStatus: (data => set(state => {
      if (!('versionStatus' in state)) return state;
      return { ...state, versionStatus: data };
    })),
    clearDraft: () => set({ ...initState }),
  }));
}
