import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

/** 사용자 공통 레이아웃: Header + 페이지 + Footer (UI 설계서 2.1) */
export default function UserLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
