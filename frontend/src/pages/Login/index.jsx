import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiError';
import LoginForm from './components/LoginForm';

const LOGIN_ERRORS = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호를 확인해주세요.',
  MEMBER_WITHDRAWN: '이용할 수 없는 계정입니다.',
};

export default function LoginPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const login = useAuthStore((state) => state.login);
  const logoutReason = useAuthStore((state) => state.logoutReason);
  const clearLogoutReason = useAuthStore((state) => state.clearLogoutReason);
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState(() => ({
    reason: logoutReason,
    message: typeof location.state?.message === 'string' ? location.state.message : '',
  }));

  useEffect(() => {
    const previousTitle = document.title;
    document.title = '로그인 - MEMORY ATTACK';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    // 화면에 옮긴 안내는 유지하되 다음 방문에서 다시 표시하지 않는다.
    if (logoutReason) {
      clearLogoutReason();
    }
  }, [logoutReason, clearLogoutReason]);

  useEffect(() => {
    if (typeof location.state?.message !== 'string') return;
    const remainingState = { ...location.state };
    delete remainingState.message;
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: remainingState,
    });
  }, [location, navigate]);

  async function handleLogin(email, password) {
    setIsLoading(true);
    setErrorMessage('');
    setNotice({ reason: null, message: '' });
    try {
      await login(email, password);
      return true; // accessToken 변경으로 아래 Navigate가 검사 화면으로 이동한다.
    } catch (error) {
      setErrorMessage(getErrorMessage(error, LOGIN_ERRORS));
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  if (accessToken) return <Navigate to="/surveys/p" replace />;

  return (
    <section data-page="login" aria-labelledby="login-title" className="w-full py-4 md:py-8">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border bg-white p-6 shadow-sm md:p-10">
        <div className="space-y-2 text-center">
          <p className="break-keep text-sm font-semibold text-primary">MEMORY ATTACK · KDSQ 인지선별검사</p>
          <h1 id="login-title" className="text-2xl font-bold">로그인</h1>
          <p className="break-keep text-base leading-relaxed text-muted-foreground">
            검사를 시작하려면 로그인해주세요.
          </p>
        </div>

        {notice.reason && (
          <Alert role="status" className="border-primary/30 bg-primary/5 text-primary">
            <Info aria-hidden="true" />
            <AlertDescription className="break-keep text-primary">{notice.reason}</AlertDescription>
          </Alert>
        )}
        {notice.message && !notice.reason && (
          <Alert role="status" className="border-success/40 bg-success/10 text-foreground">
            <CheckCircle2 aria-hidden="true" className="text-success" />
            <AlertDescription className="break-keep text-foreground">{notice.message}</AlertDescription>
          </Alert>
        )}

        <LoginForm onSubmit={handleLogin} isLoading={isLoading} errorMessage={errorMessage} />

        <div className="border-t pt-4 text-center">
          <p className="break-keep text-base text-muted-foreground">아직 회원이 아니신가요?</p>
          <Link
            to="/register"
            className="mt-2 inline-flex min-h-12 items-center rounded-lg px-3 text-base font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            회원가입하기
          </Link>
        </div>
      </div>
    </section>
  );
}
