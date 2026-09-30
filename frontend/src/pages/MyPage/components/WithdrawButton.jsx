import { Button } from '@/components/ui/button';

// DialogTrigger asChild가 전달하는 ref·이벤트·aria 속성을 Button에 그대로 넘긴다.
export default function WithdrawButton(props) {
  return (
    <Button type="button" variant="outline" {...props}
      className="min-h-12 w-full rounded-lg bg-white text-base font-semibold text-muted-foreground sm:w-auto">
      회원 탈퇴
    </Button>
  );
}
