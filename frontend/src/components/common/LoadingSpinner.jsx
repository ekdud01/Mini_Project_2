/** 데이터 로딩 표시 (UI 설계서 2.4) */
export default function LoadingSpinner() {
  return (
    <div role="status" aria-live="polite" className="flex justify-center py-16">
      <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <span className="sr-only">불러오는 중</span>
    </div>
  );
}
