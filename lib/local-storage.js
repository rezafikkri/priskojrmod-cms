export function localStorageSet(key, value) {
  if (typeof window === 'undefined') return false;

  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.error('[localStorageSet] Failed:', err);
    return false;
  }
}

export function localStorageGet(key) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;

    return JSON.parse(raw);
  } catch (err) {
    console.error('[localStorageGet] Failed:', err);
    return null;
  }
}

export function localStorageRemove(key) {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error('[localStorageRemove] Failed:', err);
    return false;
  }
}

export function localStorageClear() {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.clear();
    return true;
  } catch (err) {
    console.error('[localStorageClear] Failed:', err);
    return false;
  }
}

