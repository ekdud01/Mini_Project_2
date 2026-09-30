import { useRef } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

export default function WithdrawDialog({
  children, open, isWithdrawing, errorMessage, onOpenChange, onConfirm,
}) {
  const cancelRef = useRef(null);
  // 처리 중에는 바깥 클릭·ESC로 닫히지 않게 한다.
  const blockWhileWithdrawing = (event) => { if (isWithdrawing) event.preventDefault(); };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!isWithdrawing) onOpenChange(nextOpen); }}>
      {/* Trigger로 연결해 닫힌 뒤 Radix가 탈퇴 버튼으로 포커스를 돌려준다. */}
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        aria-busy={isWithdrawing}
        className="rounded-2xl bg-white"
        onOpenAutoFocus={(event) => { event.preventDefault(); cancelRef.current?.focus(); }}
        onEscapeKeyDown={blockWhileWithdrawing}
        onInteractOutside={blockWhileWithdrawing}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">탈퇴하시겠습니까?</DialogTitle>
          <DialogDescription className="break-keep text-base">
            탈퇴 후에는 같은 계정으로 로그인할 수 없습니다
          </DialogDescription>
        </DialogHeader>
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription className="break-keep text-base">{errorMessage}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button ref={cancelRef} type="button" variant="outline" disabled={isWithdrawing}
            onClick={() => onOpenChange(false)} className="min-h-12 rounded-lg text-base font-semibold">
            취소
          </Button>
          <Button type="button" variant="destructive" disabled={isWithdrawing} onClick={onConfirm}
            className="min-h-12 rounded-lg text-base font-semibold">
            {isWithdrawing && <Loader2 aria-hidden="true" className="animate-spin" />}
            {isWithdrawing ? '탈퇴 처리 중' : '탈퇴'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

WithdrawDialog.propTypes = {
  children: PropTypes.element.isRequired,
  open: PropTypes.bool.isRequired,
  isWithdrawing: PropTypes.bool.isRequired,
  errorMessage: PropTypes.string.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
