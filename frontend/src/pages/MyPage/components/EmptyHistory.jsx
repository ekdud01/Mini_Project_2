import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EmptyHistory() {
  return (
    <Card className="rounded-2xl bg-white py-8">
      <CardContent className="flex flex-col items-center gap-5 text-center">
        <ClipboardList aria-hidden="true" className="size-10 text-primary" />
        <p className="break-keep text-base text-muted-foreground">아직 검사 이력이 없습니다</p>
        <Button asChild size="lg" className="min-h-12 w-full rounded-lg text-base font-semibold sm:w-auto">
          <Link to="/surveys/p">검사 시작하기 <ArrowRight aria-hidden="true" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
