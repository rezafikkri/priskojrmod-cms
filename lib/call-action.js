// for client side call server action only
export async function callAction(action) {
  try {
    return await action();
  } catch (err) {
    console.error(err);
    return { status: 'error', message: 'Something went wrong. Please try again.' };
  }
}
