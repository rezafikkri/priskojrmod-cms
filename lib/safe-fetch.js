import ApplicationError from './errors/ApplicationError';

// for client side only
export async function safeFetch({
  url,
  onFinally,
  defaultErrorMessage = 'Something went wrong. Please try again.',
  signal = new AbortController().signal,
}) {
  try {
    const res = await fetch(url, { signal });
    const resJson = await res.json();

    if (resJson.status === 'error') {
      throw new ApplicationError(resJson.message);
    }

    return resJson;
  } catch (err) {
    // ignore abort error
    if (err.name === 'AbortError') return;  
    if (err.message?.includes('NS_BINDING_ABORTED')) return; // firefox specific

    if (err instanceof ApplicationError) {
      throw err;
    }

    throw new Error(defaultErrorMessage);
  } finally {
    if (typeof onFinally === 'function') {
      onFinally();
    }
  }
}
