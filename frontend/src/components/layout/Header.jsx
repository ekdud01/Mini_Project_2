import { Link } from 'react-router-dom';

/**
 * [뼈대] 상단 메뉴 (UI 설계서 2.1) — 로그인 상태에 따른 메뉴·로그아웃, 모바일 메뉴는 강찬식이 완성한다.
 */
export default function Header() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/surveys/p" className="text-lg font-bold">KDSQ</Link>
        <div className="flex gap-4 text-sm">
          <Link to="/surveys/p">검사하기</Link>
          <Link to="/mypage">마이페이지</Link>
          <Link to="/login">로그인</Link>
        </div>
      </nav>
    </header>
  );
}
