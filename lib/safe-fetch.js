export async function safeFetch({
  url,
  onFinally,
  errorMessage = 'An unexpected error occurred. Please try reloading the page.',
}) {
  let res;
  let resJson;

  try {
    res = await fetch(url);
    resJson = await res.json();
  } catch (err) {
    throw new Error(errorMessage);
  } finally {
    if (typeof onFinally === 'function') {
      onFinally();
    }
  }

  return resJson;
}
