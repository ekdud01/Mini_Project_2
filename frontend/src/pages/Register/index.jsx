import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { register } from '@/api/memberApi';
import { useAuthStore } from '@/store/authStore';
import { getErrorCode, getErrorMessage, getFieldErrors } from '@/utils/apiError';
import { SIGNUP_FIELDS } from '@/utils/validation';
import RegisterForm from './components/RegisterForm';

const FAILURE_MESSAGE = '회원가입에 실패했습니다. 다시 시도해주세요';

export default function RegisterPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = '회원가입 - MEMORY ATTACK';
    return () => { document.title = previousTitle; };
  }, []);

  async function handleRegister(body) {
    setIsLoading(true);
    try {
      await register(body);
      navigate('/login', {
        replace: true,
        state: { message: '가입이 완료되었습니다. 로그인해주세요' },
      });
    } catch (error) {
      const code = getErrorCode(error);
      if (code === 'DUPLICATE_EMAIL') {
        return { fieldErrors: { email: '이미 사용 중인 이메일입니다' }, errorMessage: '' };
      }
      if (code === 'VALIDATION_ERROR') {
        const fields = getFieldErrors(error);
        const entries = Object.entries(fields);
        const knownFields = entries.filter(([field, message]) =>
          SIGNUP_FIELDS.includes(field) && typeof message === 'string' && message.length > 0);
        return {
          fieldErrors: Object.fromEntries(knownFields),
          errorMessage: !knownFields.length || knownFields.length !== entries.length ? FAILURE_MESSAGE : '',
        };
      }
      return { fieldErrors: {}, errorMessage: getErrorMessage(error, {}, FAILURE_MESSAGE) };
    } finally {
      setIsLoading(false);
    }
  }

  if (accessToken) return <Navigate to="/surveys/p" replace />;

  return (
    <section data-page="register" aria-labelledby="register-title" className="w-full py-4 md:py-8">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border bg-white p-6 shadow-sm md:p-10">
        <div className="space-y-2 text-center">
          <h1 id="register-title" className="text-2xl font-bold">회원가입</h1>
          <p className="break-keep text-base leading-relaxed text-muted-foreground">
            간단한 가입 후 바로 인지 검사가 가능합니다.
          </p>
        </div>
        <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
        <div className="border-t pt-4 text-center">
          <Link
            to="/login"
            className="inline-flex min-h-12 items-center gap-2 rounded-lg px-3 text-base font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </section>
  );
}
