export function localStorageSet(key, value, raw = false) {
  if (typeof window === 'undefined') return false;

  try {
    const storedValue = raw ? value : JSON.stringify(value);
    localStorage.setItem(key, storedValue);
    return true;
  } catch (err) {
    console.error('[localStorageSet]', 'key:', key, 'value:', value, err);
    return false;
  }
}

export function localStorageGet(key, raw = false) {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = localStorage.getItem(key);
    if (rawValue === null) return null;

    return raw ? rawValue : JSON.parse(rawValue);
  } catch (err) {
    console.error('[localStorageGet]', 'key:', key, err);
    return null;
  }
}

export function localStorageRemove(key) {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error('[localStorageRemove]', 'key:', key, err);
    return false;
  }
}

export function localStorageClear() {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.clear();
    return true;
  } catch (err) {
    console.error('[localStorageClear]', err);
    return false;
  }
}
