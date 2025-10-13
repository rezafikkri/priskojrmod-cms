export async function safeFetch({
  url,
  onFinally,
  errorMessage = 'An unexpected error occurred. Please try reloading the page.',
  signal = new AbortController().signal,
}) {
  let res;
  let resJson;

  try {
    res = await fetch(url, { signal });
    resJson = await res.json();
  } catch (err) {
    // abaikan error abort
    if (err.name === 'AbortError') return;
    // firefox specific
    if (err.message?.includes('NS_BINDING_ABORTED')) return;

    throw new Error(errorMessage);
  } finally {
    if (typeof onFinally === 'function') {
      onFinally();
    }
  }

  return resJson;
}
