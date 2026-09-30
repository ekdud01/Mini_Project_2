import test from 'node:test';
import assert from 'node:assert/strict';
import { PASSWORD_REGEX, toSignupBody, validateSignup } from '../src/utils/validation.js';

const YEAR = 2026;
const valid = {
  name: '홍길동', email: 'new@example.com', password: 'Test1234!',
  passwordConfirm: 'Test1234!', gender: 'MALE', birthYear: '1960',
};
const validate = (changes = {}) => validateSignup({ ...valid, ...changes }, YEAR);

test('정상 입력과 앞뒤 공백을 제거한 이름·이메일은 통과한다', () => {
  assert.deepEqual(validate(), {});
  assert.deepEqual(validate({ name: ` ${'가'.repeat(50)} `, email: ' new@example.com ' }), {});
});

test('필수값 누락은 여섯 필드 오류로 반환한다', () => {
  const empty = Object.fromEntries(Object.keys(valid).map((key) => [key, '']));
  assert.deepEqual(validateSignup(empty, YEAR), {
    name: '이름을 입력해주세요', email: '이메일을 입력해주세요', password: '비밀번호를 입력해주세요',
    passwordConfirm: '비밀번호가 일치하지 않습니다', gender: '성별을 선택해주세요', birthYear: '출생년도를 입력해주세요',
  });
});

test('이름 50자는 허용하고 51자·공백만 있는 이름은 거부한다', () => {
  assert.equal(validate({ name: '가'.repeat(50) }).name, undefined);
  assert.equal(validate({ name: '가'.repeat(51) }).name, '이름은 50자 이하여야 합니다');
  assert.equal(validate({ name: '   ' }).name, '이름을 입력해주세요');
});

test('이메일 100자 경계와 형식·공백을 검사한다', () => {
  const email = `${'a'.repeat(60)}@${'b'.repeat(35)}.com`;
  assert.equal(email.length, 100);
  assert.equal(validate({ email }).email, undefined);
  assert.equal(validate({ email: `a${email}` }).email, '이메일은 100자 이하여야 합니다');
  for (const value of ['abc', 'a b@example.com', 'a@', '@example.com']) {
    assert.equal(validate({ email: value }).email, '이메일 형식이 올바르지 않습니다');
  }
});

test('비밀번호는 8·20자 경계를 허용하고 7·21자를 거부한다', () => {
  for (const length of [7, 8, 20, 21]) {
    const password = `A1!${'a'.repeat(length - 3)}`;
    assert.equal(Boolean(validate({ password, passwordConfirm: password }).password), length < 8 || length > 20);
  }
});

test('비밀번호는 모든 ASCII 특수문자 범위를 허용한다', () => {
  const codes = [...Array(94)].map((_, index) => index + 33)
    .filter((code) => !/[A-Za-z0-9]/.test(String.fromCharCode(code)));
  assert.equal(codes.length, 32);
  for (const code of codes) assert.equal(PASSWORD_REGEX.test(`Test123${String.fromCharCode(code)}`), true);
});

test('비밀번호 구성 누락·공백·한글·비ASCII·제어 문자를 거부한다', () => {
  for (const password of ['abcdefgh!', '1234567!', 'Test1234', 'Test1234! ', ' Test1234!', '한글Test12!', 'Test123😀', 'Test1234!\n', 'Test12\t!']) {
    assert.ok(validate({ password, passwordConfirm: password }).password, JSON.stringify(password));
  }
});

test('비밀번호 확인은 공백을 제거하지 않고 원문과 비교한다', () => {
  assert.equal(validate({ passwordConfirm: 'Test1234! ' }).passwordConfirm, '비밀번호가 일치하지 않습니다');
  assert.equal(validate({ password: 'Changed1!' }).passwordConfirm, '비밀번호가 일치하지 않습니다');
  assert.equal(validate({ password: 'Changed1!', passwordConfirm: 'Changed1!' }).passwordConfirm, undefined);
});

test('성별은 정해진 두 값만 허용한다', () => {
  assert.equal(validate({ gender: 'FEMALE' }).gender, undefined);
  assert.equal(validate({ gender: 'other' }).gender, '성별을 선택해주세요');
});

test('출생년도는 1900·올해를 포함하고 범위 밖은 거부한다', () => {
  assert.equal(validate({ birthYear: '1900' }).birthYear, undefined);
  assert.equal(validate({ birthYear: String(YEAR) }).birthYear, undefined);
  assert.equal(validate({ birthYear: '1899' }).birthYear, '출생년도는 1900년 이후여야 합니다');
  assert.equal(validate({ birthYear: String(YEAR + 1) }).birthYear, '출생년도는 올해까지만 입력할 수 있습니다');
});

test('출생년도는 빈 값·소수·지수·문자·자리수 오류를 구분한다', () => {
  assert.equal(validate({ birthYear: '  ' }).birthYear, '출생년도를 입력해주세요');
  for (const birthYear of ['19.5', '2e3', 'abcd', '960', '01960', '1960.0']) {
    assert.equal(validate({ birthYear }).birthYear, '출생년도는 네 자리 숫자로 입력해주세요');
  }
});

test('요청은 이름·이메일만 정리하고 비밀번호 확인 제외·출생년도 숫자 변환을 적용한다', () => {
  assert.deepEqual(toSignupBody({ ...valid, name: ' 홍길동 ', email: ' new@example.com ', password: ' Test1234! ' }), {
    name: '홍길동', email: 'new@example.com', password: ' Test1234! ', gender: 'MALE', birthYear: 1960,
  });
});
