/**
 * 상단 메뉴 — 로그인 상태에 따른 메뉴·로그아웃, 모바일 메뉴는 강찬식이 완성한다.
 * 로고 + 서비스명, 현재 메뉴는 파란색 
 */

import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const MEMBER_LINKS = [
  { to: '/surveys/p', label: '검사하기' },
  { to: '/mypage', label: '마이페이지' },
];

const GUEST_LINKS = [
  { to: '/login', label: '로그인' },
  { to: '/register', label: '회원가입' },
];

// 데스크톱에서 메뉴 링크·버튼을 모두 40px(h-10)로 맞춰 로그인 여부와 상관없이 헤더 높이를 같게 한다.
const textLinkClass = (isActive) =>
  cn(
    'inline-flex min-h-12 items-center px-4 font-medium transition-colors hover:text-primary md:h-10 md:min-h-0 md:px-0',
    isActive ? 'font-bold text-primary' : 'text-slate-700',
  );

const pillClass =
  'inline-flex min-h-12 items-center gap-2 rounded-full border px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 md:h-10 md:min-h-0';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';


export default function Header() {
  const isLoggedIn = useAuthStore((state) => Boolean(state.accessToken));
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const loggingOutRef = useRef(false);

  async function handleLogout() {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setIsLoggingOut(true);
    try {
      await logout();
      // 요청 중 다른 계정으로 로그인했다면 그 새 세션의 화면은 이동시키지 않는다.
      if (!useAuthStore.getState().accessToken) navigate('/login', { replace: true });
    } finally {
      loggingOutRef.current = false;
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="border-b bg-white">
      {/* 경로·인증 상태가 바뀌면 모바일 펼침 상태도 초기화한다. */}
      <HeaderNavigation
        key={`${location.key}:${isLoggedIn}`}
        pathname={location.pathname}
        isLoggedIn={isLoggedIn}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />
    </header>
  );
}

function HeaderNavigation({ pathname, isLoggedIn, isLoggingOut, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigationRef = useRef(null);
  const toggleRef = useRef(null);
  const links = isLoggedIn ? MEMBER_LINKS : GUEST_LINKS;

  useEffect(() => {
    if (!isOpen) return;
    function closeOutside(event) {
      if (!navigationRef.current?.contains(event.target)) setIsOpen(false);
    }
    const desktop = window.matchMedia('(min-width: 768px)');
    function closeOnDesktop(event) {
      if (event.matches) setIsOpen(false);
    }
    document.addEventListener('pointerdown', closeOutside);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [isOpen]);

  return (
    <nav
      ref={navigationRef}
      aria-label="주 메뉴"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.preventDefault();
          setIsOpen(false);
          toggleRef.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
      className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 py-4 md:px-8"
    >
      <Link
        to={isLoggedIn ? '/surveys/p' : '/login'}
        onClick={() => setIsOpen(false)}
        aria-label="MEMORY ATTACK 홈"
        className={cn('flex items-center gap-2 rounded-lg', focusRing)}
      >
        <span className="text-2xl font-extrabold text-primary">MEMORY ATTACK</span>
      </Link>

      <Button
        ref={toggleRef}
        type="button"
        variant="outline"
        size="icon"
        aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={isOpen}
        aria-controls="user-navigation"
        onClick={() => setIsOpen((current) => !current)}
        className="size-12 rounded-lg md:hidden"
      >
        {isOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
      </Button>

      <div
        id="user-navigation"
        className={cn(
          'mt-3 w-full flex-col gap-2 border-t pt-3 md:mt-0 md:flex md:w-auto md:flex-row md:items-center md:gap-8 md:border-0 md:pt-0',
          isOpen ? 'flex' : 'hidden',
        )}
      >
        {links.map(({ to, label, pill }) => {
          const isActive = to === '/surveys/p' ? pathname.startsWith('/surveys/') : pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setIsOpen(false)}
              className={cn(pill ? pillClass : textLinkClass(isActive), focusRing)}
            >
              {label}
            </Link>
          );
        })}
        {isLoggedIn && (
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            className={cn(pillClass, focusRing, 'disabled:opacity-60')}
          >
            {isLoggingOut
              ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              : <LogOut className="size-4" aria-hidden="true" />}
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        )}
      </div>
    </nav>
  );
}

HeaderNavigation.propTypes = {
  pathname: PropTypes.string.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  isLoggingOut: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
};
