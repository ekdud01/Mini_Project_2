import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { SIGNUP_FIELDS, toSignupBody, validateSignup } from '@/utils/validation';

const INITIAL_FORM = { name: '', email: '', password: '', passwordConfirm: '', gender: '', birthYear: '' };
const TEXT_FIELDS = [
  { field: 'name', label: '이름', autoComplete: 'name', placeholder: '홍길동', maxLength: 50 },
  { field: 'email', label: '이메일', type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'example@email.com', maxLength: 100 },
  { field: 'password', label: '비밀번호', type: 'password', autoComplete: 'new-password', placeholder: '8~20자 입력', maxLength: 20 },
  { field: 'passwordConfirm', label: '비밀번호 확인', type: 'password', autoComplete: 'new-password', placeholder: '비밀번호를 한 번 더 입력해주세요', maxLength: 20 },
];

export default function RegisterForm({ onSubmit, isLoading = false }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const inputRefs = useRef({});
  const alertRef = useRef(null);
  const submittingRef = useRef(false);

  function focusErrors(fieldErrors) {
    const firstField = SIGNUP_FIELDS.find((field) => fieldErrors[field]);
    if (firstField) inputRefs.current[firstField]?.focus();
    else alertRef.current?.focus();
  }

  function updateField(field, value) {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setErrorMessage('');
    const nextErrors = validateSignup(nextForm);
    setErrors((current) => {
      const updated = { ...current };
      if (current[field]) {
        delete updated[field];
        if (nextErrors[field]) updated[field] = nextErrors[field];
      }
      // 확인란이 비어 있는 첫 입력 중에는 오류를 띄우지 않고, 입력했다면 다시 비교한다.
      if (field === 'password' && (nextForm.passwordConfirm || current.passwordConfirm)) {
        delete updated.passwordConfirm;
        if (nextErrors.passwordConfirm) updated.passwordConfirm = nextErrors.passwordConfirm;
      }
      return updated;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isLoading || submittingRef.current) return;
    const fieldErrors = validateSignup(form);
    setErrors(fieldErrors);
    setErrorMessage('');
    if (Object.keys(fieldErrors).length) {
      focusErrors(fieldErrors);
      return;
    }
    submittingRef.current = true;
    try {
      const failure = await onSubmit(toSignupBody(form));
      if (failure) {
        setErrors(failure.fieldErrors);
        setErrorMessage(failure.errorMessage);
        // 서버 응답 후 오류 DOM과 disabled 상태가 반영된 다음 포커스를 옮긴다.
        requestAnimationFrame(() => focusErrors(failure.fieldErrors));
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={isLoading} className="space-y-6">
      {TEXT_FIELDS.map(({ field, label, type = 'text', ...inputProps }) => {
        const isPassword = type === 'password';
        const id = `register-${field}`;
        const describedBy = errors[field] ? `${id}-error` : field === 'password' ? `${id}-hint` : undefined;
        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={id} className="text-base font-semibold">
              {label} <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <Input
                {...inputProps}
                ref={(element) => { inputRefs.current[field] = element; }}
                id={id}
                name={field}
                type={isPassword && visiblePasswords[field] ? 'text' : type}
                autoCapitalize={field === 'email' ? 'none' : undefined}
                spellCheck={false}
                value={form[field]}
                onChange={(event) => updateField(field, event.target.value)}
                readOnly={isLoading}
                aria-required="true"
                aria-invalid={Boolean(errors[field])}
                aria-describedby={describedBy}
                className={cn('h-12 rounded-lg bg-slate-50 px-4 text-base md:text-base', isPassword && 'pr-14')}
              />
              {isPassword && (
                <button
                  type="button"
                  aria-label={`${label} ${visiblePasswords[field] ? '숨기기' : '보기'}`}
                  aria-pressed={Boolean(visiblePasswords[field])}
                  onClick={() => setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))}
                  className="absolute inset-y-0 right-0 flex size-12 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {visiblePasswords[field] ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                </button>
              )}
            </div>
            {errors[field] ? (
              <p id={`${id}-error`} role="alert" className="break-keep text-sm font-medium text-destructive">{errors[field]}</p>
            ) : field === 'password' && (
              <p id={`${id}-hint`} className="break-keep text-sm text-muted-foreground">8~20자, 영문·숫자·특수문자를 모두 포함해주세요.</p>
            )}
          </div>
        );
      })}

      <div className="space-y-2">
        <Label id="register-gender-label" className="text-base font-semibold">
          성별 <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <RadioGroup
          name="gender"
          value={form.gender}
          onValueChange={(value) => updateField('gender', value)}
          disabled={isLoading}
          aria-labelledby="register-gender-label"
          aria-required="true"
          aria-invalid={Boolean(errors.gender)}
          aria-describedby={errors.gender ? 'register-gender-error' : undefined}
          className="grid grid-cols-2 gap-3"
        >
          {[['MALE', '남성'], ['FEMALE', '여성']].map(([value, label], index) => (
            <label
              key={value}
              htmlFor={`register-gender-${value}`}
              className={cn(
                'flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-lg border-2 text-lg hover:bg-slate-50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
                form.gender === value ? 'border-primary bg-primary/5 font-semibold text-primary' : 'border-border bg-white',
                errors.gender && 'border-destructive/50',
                isLoading && 'cursor-wait opacity-50',
              )}
            >
              <RadioGroupItem
                ref={index === 0 ? (element) => { inputRefs.current.gender = element; } : undefined}
                id={`register-gender-${value}`}
                value={value}
                aria-invalid={Boolean(errors.gender)}
                aria-describedby={errors.gender ? 'register-gender-error' : undefined}
              />
              {label}
            </label>
          ))}
        </RadioGroup>
        {errors.gender && <p id="register-gender-error" role="alert" className="break-keep text-sm font-medium text-destructive">{errors.gender}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-birthYear" className="text-base font-semibold">
          출생년도 <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          ref={(element) => { inputRefs.current.birthYear = element; }}
          id="register-birthYear"
          name="birthYear"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="bday-year"
          placeholder="예: 1960"
          value={form.birthYear}
          onChange={(event) => updateField('birthYear', event.target.value)}
          readOnly={isLoading}
          aria-required="true"
          aria-invalid={Boolean(errors.birthYear)}
          aria-describedby={errors.birthYear ? 'register-birthYear-error' : undefined}
          className="h-12 rounded-lg bg-slate-50 px-4 text-base md:text-base"
        />
        {errors.birthYear && <p id="register-birthYear-error" role="alert" className="break-keep text-sm font-medium text-destructive">{errors.birthYear}</p>}
      </div>

      {errorMessage && (
        <Alert ref={alertRef} tabIndex={-1} variant="destructive" role="alert">
          <AlertCircle aria-hidden="true" />
          <AlertDescription className="break-keep font-medium">{errorMessage}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={isLoading} aria-busy={isLoading} className="h-14 w-full rounded-lg text-lg font-bold">
        {isLoading && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {isLoading ? '가입 처리 중...' : '회원가입 완료'}
      </Button>
    </form>
  );
}

RegisterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};
