import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'mypage-profile-title', label: '회원 정보' },
  { id: 'mypage-trend-title', label: '검사 결과 추이' },
  { id: 'mypage-history-title', label: '검사 이력' },
];
const READING_GAP = 16;

export default function MyPageSectionNav({ hasHistory }) {
  const navRef = useRef(null);
  const [currentId, setCurrentId] = useState(SECTIONS[0].id);
  const sections = hasHistory ? SECTIONS : SECTIONS.filter(({ id }) => id !== 'mypage-trend-title');

  useEffect(() => {
    const nav = navRef.current;
    const page = nav.closest('[data-page="mypage"]');
    const header = page.closest('main')?.previousElementSibling;
    const headings = SECTIONS.map(({ id }) => page.querySelector(`#${id}`)).filter(Boolean);
    let frame = 0;

    function update() {
      frame = 0;
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const offset = headerHeight + nav.getBoundingClientRect().height + READING_GAP;
      page.style.setProperty('--mypage-header-height', `${headerHeight}px`);
      page.style.setProperty('--mypage-scroll-offset', `${offset}px`);
      let active = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= offset + 1) active = heading;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        active = headings.at(-1);
      }
      setCurrentId(active.id);
    }

    function scheduleUpdate() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    // 헤더 메뉴, 목차 줄바꿈, 이력 페이지 높이 변화도 읽기 시작선에 반영한다.
    const observer = new ResizeObserver(scheduleUpdate);
    [header, nav, page].filter(Boolean).forEach((element) => observer.observe(element));
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.cancelAnimationFrame(frame);
      page.style.removeProperty('--mypage-header-height');
      page.style.removeProperty('--mypage-scroll-offset');
    };
  }, [hasHistory]);

  function handleNavigate(event, id) {
    // 새 탭 등 브라우저의 수정키 링크 동작은 그대로 둔다.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const heading = document.getElementById(id);
    if (!heading) return;
    event.preventDefault();
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  return (
    <nav ref={navRef} aria-label="마이페이지 목차"
      className="sticky top-[var(--mypage-header-height,0px)] z-20 border-b-2 border-slate-300 bg-slate-50 pt-2 md:hidden">
      <div className="flex items-stretch gap-1">
        {sections.map(({ id, label }) => (
          <a key={id} href={`#${id}`} aria-current={currentId === id ? 'location' : undefined}
            onClick={(event) => handleNavigate(event, id)}
            className={cn(
              'flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-t-xl border-2 px-2 py-3 text-center text-base break-keep focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              currentId === id
                ? 'border-primary border-b-slate-50 bg-white font-bold text-blue-700'
                : 'border-slate-200 bg-slate-100 font-medium text-slate-700 hover:bg-white',
            )}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

MyPageSectionNav.propTypes = { hasHistory: PropTypes.bool.isRequired };
