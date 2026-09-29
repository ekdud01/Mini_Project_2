import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * 상단 메뉴 — 로그인 상태에 따른 메뉴·로그아웃, 모바일 메뉴는 강찬식이 완성한다.
 * 로고 + 서비스명, 현재 메뉴는 파란색 
 */
const navClass = ({ isActive }) =>
  cn('font-medium transition-colors hover:text-primary', isActive ? 'font-bold text-primary' : 'text-slate-700');

export default function Header() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/surveys/p" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-primary">MEMORY ATTACK</span>
        </Link>
        <div className="flex items-center gap-6 md:gap-8">
          <NavLink to="/surveys/p" className={navClass}>검사하기</NavLink>
          <NavLink to="/mypage" className={navClass}>마이페이지</NavLink>
          <Link to="/login" className="rounded-full border px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            로그인
          </Link>
        </div>
      </nav>
    </header>
  );
}
