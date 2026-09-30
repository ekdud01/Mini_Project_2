import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MemberShape } from '@/types/propTypes';
import ReadOnlyNotice from './ReadOnlyNotice';

const GENDER_LABELS = { MALE: '남성', FEMALE: '여성' };

export default function ProfileCard({ me }) {
  const currentYear = new Date().getFullYear();
  const fields = [
    ['이름', me.name],
    ['이메일', me.email],
    ['성별', GENDER_LABELS[me.gender] ?? '-'],
    ['출생년도', `${me.birthYear} (${currentYear - me.birthYear}세)`],
  ];

  return (
    <section aria-labelledby="mypage-profile-title">
      <Card className="min-w-0 rounded-2xl bg-white">
        <CardHeader>
          <h2 id="mypage-profile-title" className="text-2xl font-bold">회원정보</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="space-y-5 text-base">
            {fields.map(([label, value]) => (
              <div key={label} className="grid min-w-0 gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
                <dt className="font-semibold">{label}</dt>
                <dd className="min-w-0 [overflow-wrap:anywhere]">{value}</dd>
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
