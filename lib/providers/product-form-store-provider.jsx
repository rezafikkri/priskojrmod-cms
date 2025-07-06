'use client';

import { createContext, useRef, useContext } from 'react';
import { useStore } from 'zustand';
import { createProductFormStore } from '../stores/product-form-store';

export const ProductFormStoreContext = createContext(undefined);

export const ProductFormStoreProvider = ({ children, initState }) => {
  const storeRef = useRef(null);

  if (storeRef.current === null) {
    if (initState) {
      storeRef.current = createProductFormStore(initState);
    } else {
      storeRef.current = createProductFormStore();
    }
  }

  return (
    <ProductFormStoreContext.Provider value={storeRef.current}>
      {children}
    </ProductFormStoreContext.Provider>
  );
}

export const useProductFormStore = (selector) => {
  const productFormStoreContext = useContext(ProductFormStoreContext);

  if (!productFormStoreContext) {
    throw new Error('useProductFormStore must be used within ProductFormStoreProvider');
  }

  return useStore(productFormStoreContext, selector);
}
