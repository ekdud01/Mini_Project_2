import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ReadOnlyNotice() {
  return (
    <Alert role="note" className="border-primary/30 bg-primary/5 text-primary">
      <Info aria-hidden="true" />
      <AlertDescription className="break-keep text-sm leading-relaxed text-primary">
        회원정보 변경이 필요하시면 관리자에게 문의해주세요
      </AlertDescription>
    </Alert>
  );
}
