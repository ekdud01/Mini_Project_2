import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useMemberStore } from '@/store/memberStore';
import { getErrorMessage } from '@/utils/apiError';
import ProfileCard from './components/ProfileCard';
import EmptyHistory from './components/EmptyHistory';
import ExamHistoryTable from './components/ExamHistoryTable';
import ExamTrendChart from './components/ExamTrendChart';
import WithdrawButton from './components/WithdrawButton';
import WithdrawDialog from './components/WithdrawDialog';
import MyPageSectionNav from './components/MyPageSectionNav';
import { HISTORY_PAGE_SIZE, MOBILE_HISTORY_PAGE_SIZE } from './history';

const WITHDRAW_COMPLETE_MESSAGE = '회원 탈퇴가 완료되었습니다';

export default function MyPage() {
  const navigate = useNavigate();
  const me = useMemberStore((state) => state.me);
  const history = useMemberStore((state) => state.history);
  const historyMeta = useMemberStore((state) => state.historyMeta);
  const fetchMe = useMemberStore((state) => state.fetchMe);
  const fetchMyResults = useMemberStore((state) => state.fetchMyResults);
  const withdraw = useMemberStore((state) => state.withdraw);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(() =>
    window.matchMedia('(min-width: 768px)').matches ? HISTORY_PAGE_SIZE : MOBILE_HISTORY_PAGE_SIZE);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const requestId = useRef(0);
  const activeController = useRef(null);
  const withdrawInFlight = useRef(false);
  const isMounted = useRef(false);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const handleChange = () => {
      setHistoryPageSize(desktop.matches ? HISTORY_PAGE_SIZE : MOBILE_HISTORY_PAGE_SIZE);
      // 카드/표 전환 시 유효하지 않은 페이지 번호가 남거나 되살아나지 않게 한다.
      setHistoryPage(1);
    };
    desktop.addEventListener('change', handleChange);
    return () => desktop.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

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
        setHistoryPage(1);
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

  function handleWithdrawOpenChange(open) {
    if (withdrawInFlight.current) return;
    setIsWithdrawOpen(open);
    if (!open) setWithdrawError('');
  }

  async function handleWithdraw() {
    // 상태 반영 전 연속 클릭도 DELETE 한 번만 보낸다.
    if (withdrawInFlight.current) return;
    withdrawInFlight.current = true;
    // 진행 중 조회가 있으면 무효화한다. 이미 보낸 DELETE는 취소하지 않는다.
    requestId.current++;
    activeController.current?.abort();
    setIsWithdrawing(true);
    setWithdrawError('');
    try {
      // true는 reset 세대가 유지된 204에서 logout({ callApi: false })까지 끝난 경우뿐이다.
      if (await withdraw()) {
        // logout으로 보호 경로가 먼저 /login으로 보내더라도 완료 안내 state로 덮어쓴다.
        navigate('/login', { replace: true, state: { message: WITHDRAW_COMPLETE_MESSAGE } });
        return;
      }
      if (isMounted.current) setWithdrawError('회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해주세요');
    } catch (error) {
      // 계정 변경 등으로 취소된 요청은 안내하지 않는다.
      if (!isMounted.current || axios.isCancel(error)) return;
      setWithdrawError(getErrorMessage(error, {}, '회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해주세요'));
    } finally {
      withdrawInFlight.current = false;
      if (isMounted.current) setIsWithdrawing(false);
    }
  }

  return (
    <section data-page="mypage" aria-labelledby="mypage-title" className="w-full space-y-10 pb-4 md:pb-8">
      <h1 id="mypage-title" className="mb-6! break-keep text-center text-2xl font-bold">마이페이지</h1>

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
          <MyPageSectionNav hasHistory={history.length > 0} />
          <ProfileCard me={me} />
          <ExamTrendChart results={history} totalElements={historyMeta?.totalElements} />
          <section aria-labelledby="mypage-history-title" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="mypage-history-title" tabIndex={-1} className="scroll-mt-[var(--mypage-scroll-offset,1rem)] text-2xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">검사 이력</h2>
              <p className="text-base text-muted-foreground">총 {historyMeta?.totalElements ?? history.length}건</p>
            </div>
            {historyMeta?.totalElements > history.length && (
              <p className="text-base text-muted-foreground">최근 100건을 표시합니다</p>
            )}
            {history.length === 0 ? <EmptyHistory /> : (
              <ExamHistoryTable results={history} page={historyPage} pageSize={historyPageSize} onPageChange={setHistoryPage}
                onDetail={(resultId) => navigate(`/results/${resultId}`)} />
            )}
          </section>
          <div className="flex justify-end border-t pt-6">
            <WithdrawDialog open={isWithdrawOpen} isWithdrawing={isWithdrawing} errorMessage={withdrawError}
              onOpenChange={handleWithdrawOpenChange} onConfirm={handleWithdraw}>
              <WithdrawButton />
            </WithdrawDialog>
          </div>
        </>
      ) : null}
    </section>
  );
}
