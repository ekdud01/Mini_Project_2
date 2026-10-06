import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginForm({ onSubmit, isLoading = false, errorMessage = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [validationMessage, setValidationMessage] = useState('');
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const submittingRef = useRef(false);
  const message = validationMessage || errorMessage;

  async function handleSubmit(event) {
    event.preventDefault();
    if (isLoading || submittingRef.current) return;

    const normalizedEmail = email.trim();
    const nextErrors = {};
    if (!normalizedEmail) nextErrors.email = '이메일을 입력해주세요';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = '이메일 형식이 올바르지 않습니다';
    }
    if (!password.trim()) nextErrors.password = '비밀번호를 입력해주세요';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setValidationMessage(!normalizedEmail || !password.trim()
        ? '이메일과 비밀번호를 입력해주세요'
        : '이메일 형식이 올바르지 않습니다');
      (nextErrors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setValidationMessage('');
    submittingRef.current = true;
    try {
      // 실패 문구는 페이지가 설정하고, 폼은 다시 입력할 위치로 포커스를 돌린다.
      const succeeded = await onSubmit(normalizedEmail, password);
      if (succeeded === false) emailRef.current?.focus();
    } finally {
      submittingRef.current = false;
    }
  }

  function clearFieldError(field) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setValidationMessage('');
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={isLoading} className="space-y-6">
      {message && (
        <Alert id="login-error" variant="destructive" role="alert">
          <AlertCircle aria-hidden="true" />
          <AlertDescription className="break-keep font-medium">{message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-base font-semibold">
          이메일 <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          ref={emailRef}
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          placeholder="example@email.com"
          value={email}
          onChange={(event) => { setEmail(event.target.value); clearFieldError('email'); }}
          readOnly={isLoading}
          aria-required="true"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : message ? 'login-error' : undefined}
          className="h-12 rounded-lg bg-slate-50 px-4 text-base md:text-base"
        />
        {errors.email && (
          <p id="login-email-error" role="alert" className="break-keep text-sm font-medium text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-base font-semibold">
          비밀번호 <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <div className="relative">
          <Input
            ref={passwordRef}
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChange={(event) => { setPassword(event.target.value); clearFieldError('password'); }}
            readOnly={isLoading}
            aria-required="true"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : message ? 'login-error' : undefined}
            className="h-12 rounded-lg bg-slate-50 px-4 pr-14 text-base md:text-base"
          />
          <button
            type="button"
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 flex size-12 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
          </button>
        </div>
        {errors.password && (
          <p id="login-password-error" role="alert" className="break-keep text-sm font-medium text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isLoading} aria-busy={isLoading} className="h-14 w-full rounded-lg text-lg font-bold">
        {isLoading && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  errorMessage: PropTypes.string,
};
