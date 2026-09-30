import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useMemberStore } from '@/store/memberStore';
import { getErrorMessage } from '@/utils/apiError';
import ProfileCard from './components/ProfileCard';
import EmptyHistory from './components/EmptyHistory';

export default function MyPage() {
  const me = useMemberStore((state) => state.me);
  const history = useMemberStore((state) => state.history);
  const fetchMe = useMemberStore((state) => state.fetchMe);
  const fetchMyResults = useMemberStore((state) => state.fetchMyResults);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const requestId = useRef(0);
  const activeController = useRef(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = '마이페이지 - MEMORY ATTACK';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const currentId = ++requestId.current;
    const isCurrent = () => requestId.current === currentId;

    async function loadProfileAndHistory() {
      try {
        await Promise.all([
          fetchMe({ signal: controller.signal }),
          fetchMyResults({ signal: controller.signal }),
        ]);
        if (!isCurrent() || controller.signal.aborted) return;
        setErrorMessage('');
      } catch (error) {
        if (!isCurrent() || controller.signal.aborted || axios.isCancel(error)) return;
        // 첫 실패를 보존하고 아직 진행 중인 다른 조회의 저장을 막는다.
        controller.abort();
        setErrorMessage(getErrorMessage(error, {}, '정보를 불러오지 못했습니다'));
      } finally {
        // 실패 처리에서 직접 abort한 경우에도 현재 화면의 로딩은 종료한다.
        if (isCurrent()) setIsLoading(false);
      }
    }

    void loadProfileAndHistory();
    return () => {
      requestId.current = currentId + 1;
      controller.abort();
      activeController.current = null;
    };
  }, [fetchMe, fetchMyResults, retryAttempt]);

  function handleRetry() {
    // effect가 다시 실행되기 전에도 이전 catch/finally를 무효화한다.
    requestId.current++;
    activeController.current?.abort();
    setIsLoading(true);
    setErrorMessage('');
    setRetryAttempt((attempt) => attempt + 1);
  }

  return (
    <section data-page="mypage" aria-labelledby="mypage-title" className="w-full space-y-8 py-4 md:py-8">
      <h1 id="mypage-title" className="break-keep text-center text-2xl font-bold">마이페이지</h1>

      {isLoading ? (
        <LoadingSpinner />
      ) : errorMessage ? (
        <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription className="break-keep text-base">{errorMessage}</AlertDescription>
          </Alert>
          <Button type="button" onClick={handleRetry} className="min-h-12 w-full rounded-lg text-base font-semibold sm:w-auto">
            다시 시도
          </Button>
        </div>
      ) : me ? (
        <>
          <ProfileCard me={me} />
          <section aria-labelledby="mypage-history-title" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="mypage-history-title" className="text-2xl font-bold">검사 이력</h2>
              <p className="text-base text-muted-foreground">총 {history.length}건</p>
            </div>
            {history.length === 0 && <EmptyHistory />}
            {/* 이력이 있는 경우의 표·모바일 카드와 추이 차트는 3·4단계에서 연결한다. */}
          </section>
        </>
      ) : null}
    </section>
  );
}
