import { createStore } from 'zustand/vanilla';

export const createProductFormStore = (initState) => {
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
