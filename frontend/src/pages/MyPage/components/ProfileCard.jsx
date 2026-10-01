import { Card, CardContent } from '@/components/ui/card';
import { MemberShape } from '@/types/propTypes';
import { formatKoreanDate } from '@/utils/date';
import ReadOnlyNotice from './ReadOnlyNotice';

const GENDER_LABELS = { MALE: '남성', FEMALE: '여성' };

export default function ProfileCard({ me }) {
  const currentYear = new Date().getFullYear();
  const fields = [
    ['이메일', me.email],
    ['성별', GENDER_LABELS[me.gender] ?? '-'],
    ['출생년도', `${me.birthYear}년 (${currentYear - me.birthYear}세)`],
    ['가입일', formatKoreanDate(me.createdAt) || '-'],
  ];

  return (
    <section aria-labelledby="mypage-profile-title" className="min-w-0 space-y-4">
      <h2 id="mypage-profile-title" tabIndex={-1} className="scroll-mt-[var(--mypage-scroll-offset,1rem)] text-2xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">회원 정보</h2>
      <Card className="min-w-0 rounded-2xl bg-white">
        <CardContent className="space-y-6 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-4 border-b pb-6">
            <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {Array.from(me.name.trim())[0] ?? ''}
            </span>
            <p className="min-w-0 text-2xl font-bold [overflow-wrap:anywhere]">{me.name}</p>
          </div>
          <dl className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2 md:gap-y-6">
            {fields.map(([label, value]) => (
              <div key={label} className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 md:block md:space-y-1">
                <dt className="text-base text-muted-foreground">{label}</dt>
                <dd className="min-w-0 text-lg font-semibold [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>
          <ReadOnlyNotice />
        </CardContent>
      </Card>
    </section>
  );
}

ProfileCard.propTypes = { me: MemberShape.isRequired };
