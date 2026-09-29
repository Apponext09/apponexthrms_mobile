// Turns any axios/API error into a human readable message
export const getErrorMessage = (
  err,
  fallback = 'Something went wrong. Please try again.',
) => {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  const data = err.response?.data;
  const msg =
    data?.error?.message ||
    data?.message ||
    (Array.isArray(data?.errors) && data.errors[0]?.message) ||
    err.message;
  if (err.code === 'ECONNABORTED')
    return 'The request timed out. Check your connection.';
  if (err.message === 'Network Error')
    return 'No internet connection. Please check your network.';
  return msg || fallback;
};
