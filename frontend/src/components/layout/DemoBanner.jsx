import { FlaskConical } from 'lucide-react';

/**
 * 체험판 안내 (npm run build:demo 빌드에서만 표시)
 * 백엔드 없이 MSW Mock으로 동작하므로 가입 정보는 브라우저 메모리에만 남는다
 */
export default function DemoBanner() {
  return (
    <div role="note" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
      <div className="mx-auto flex w-full max-w-4xl items-start gap-2">
        <FlaskConical aria-hidden="true" className="mt-1 size-5 shrink-0" />
        <div className="space-y-1 break-keep text-base leading-relaxed">
          <p className="font-semibold">체험용 화면입니다 · 실제 개인정보를 입력하지 마세요</p>
          <p>
            샘플 계정 <span className="font-mono">testuser26@test.com</span> / <span className="font-mono">Test1234!</span>
            {' '}(검사 이력 23건) · 새로 가입한 계정은 새로고침하면 사라져요
          </p>
        </div>
      </div>
    </div>
  );
}
