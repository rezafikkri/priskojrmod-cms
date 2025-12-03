import { v4 } from 'uuid';
import { createStore } from 'zustand/vanilla';

export const defaultInitState = {
  form: {
    basic: {
      name: '',
      category_id: '',
      owner_id: '',
      license_id: '',
      price_type: '',
      drive_file_id: '',
      download_url: '',
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
          download_url: '',
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
  },
  reference: {},
  meta: {},
};

export const createProductFormStore = (initState = defaultInitState) => {
  return createStore((set) => ({
    ...initState,
    setBasic: (data) =>
      set(state => ({
        form: { ...state.form, basic: data },
      })),
    setContent: (data) => 
      set(state => ({
        form: { ...state.form, content: data },
      })),
    setExtras: (data) => 
      set(state => ({
        form: { ...state.form, extras: data },
      })),
    setPricing: (data) =>
      set(state => ({
        form: { ...state.form, pricing: data },
      })),
    setVersionStatus: (data => set(state => {
      if (!('versionStatus' in state.meta)) return state;
      return { meta: { ...state.meta, versionStatus: data } };
    })),
    setReference: (data => set({ reference: data })),
    clearDraft: () => set({ ...initState }),
  }));
}
