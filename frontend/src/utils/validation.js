// SignupRequest.PASSWORD_REGEX와 같은 ASCII 영문·숫자·특수문자 규칙.
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!-/:-@[-`{-~])[!-~]{8,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SIGNUP_FIELDS = ['name', 'email', 'password', 'passwordConfirm', 'gender', 'birthYear'];

/** 오류 문구는 REST 설계서 3.1.1 기준. 검증과 전송 모두 이름·이메일을 trim한다. */
export function validateSignup(form, currentYear = new Date().getFullYear()) {
  const errors = {};
  const name = form.name.trim();
  const email = form.email.trim();

  if (!name) errors.name = '이름을 입력해주세요';
  else if (name.length > 50) errors.name = '이름은 50자 이하여야 합니다';

  if (!email) errors.email = '이메일을 입력해주세요';
  else if (email.length > 100) errors.email = '이메일은 100자 이하여야 합니다';
  else if (!EMAIL_REGEX.test(email)) errors.email = '이메일 형식이 올바르지 않습니다';

  if (!form.password) errors.password = '비밀번호를 입력해주세요';
  else if (!PASSWORD_REGEX.test(form.password)) {
    errors.password = '비밀번호는 8~20자의 영문, 숫자, 특수문자를 모두 포함해야 합니다';
  }

  if (!form.passwordConfirm || form.passwordConfirm !== form.password) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다';
  }
  if (!['MALE', 'FEMALE'].includes(form.gender)) errors.gender = '성별을 선택해주세요';

  if (!form.birthYear.trim()) errors.birthYear = '출생년도를 입력해주세요';
  else if (!/^\d{4}$/.test(form.birthYear)) errors.birthYear = '출생년도는 네 자리 숫자로 입력해주세요';
  else if (Number(form.birthYear) < 1900) errors.birthYear = '출생년도는 1900년 이후여야 합니다';
  else if (Number(form.birthYear) > currentYear) errors.birthYear = '출생년도는 올해까지만 입력할 수 있습니다';

  return errors;
}

export function toSignupBody(form) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password,
    gender: form.gender,
    birthYear: Number(form.birthYear),
  };
}
