const NETWORK_ERROR = '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요';
const DEFAULT_ERROR = '일시적인 오류입니다. 잠시 후 다시 시도해주세요';

export const getErrorCode = (error) => error?.response?.data?.error?.code;

export function getFieldErrors(error) {
  const fields = error?.response?.data?.error?.fields;
  if (!Array.isArray(fields)) return {};
  return Object.fromEntries(fields.map(({ field, message }) => [field, message]));
}

export function getErrorMessage(error, messages = {}, fallback = DEFAULT_ERROR) {
  if (!error?.response && error?.request) return NETWORK_ERROR;
  return messages[getErrorCode(error)] ?? fallback;
}
