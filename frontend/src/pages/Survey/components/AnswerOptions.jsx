/**
 * 답변 선택지
 * 아니다 = 0, 가끔(조금) 그렇다 = 1, 자주(많이) 그렇다 = 2
 *
 * 배치 (UI 설계서 7장)
 * - 768px 미만(모바일): 세로 1열, 각 선택지 전체 폭
 * - 768px 이상(md:): 가로 3칸. 모양·글자 크기(18px)는 같고, 칸이 좁아지는 만큼 안쪽 여백·간격만 줄인다.
 * 접근성 (UI 설계서 8장): 높이 48px 이상, 선택지 사이 간격 8px 이상, 방향키 이동·Space 선택(RadioGroup),
 * 키보드 포커스 시 선택지 박스 전체에 테두리 표시
 */

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { ANSWER_OPTIONS } from "@/utils/kdsq";
import PropTypes from "prop-types";
import React, { useId } from "react";

function AnswerOptions({ value, onChange, invalid = false }) {
    const baseId = useId();

    return (
        <RadioGroup
            value={value === null || value === undefined ? '' : String(value)}
            onValueChange={(v) => onChange(Number(v))}
            aria-label="답변 선택"
            aria-invalid={invalid || undefined}
            className="grid-cols-1 gap-3 md:grid-cols-3 md:gap-2"
        >
            {ANSWER_OPTIONS.map((option) => {
                const id = `${baseId}-${option.value}`;
                const selected = value === option.value;
                return (
                    <label
                        key={option.value}
                        htmlFor={id}
                        className={cn(
                            'flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-lg transition-colors hover:bg-slate-50',
                            'md:gap-2 md:px-2.5',
                            'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
                            selected && 'border-primary bg-primary/5 font-semibold text-primary hover:bg-primary/5',
                            invalid && !selected && 'border-destructive/50',
                        )}
                    >
                        <RadioGroupItem
                            id={id}
                            value={String(option.value)}
                            className="size-6 border-2 border-slate-300 data-[state=checked]:border-primary [&_svg]:size-4"
                        />
                        {option.label}
                    </label>
                );
            })}
        </RadioGroup>
    );
};

AnswerOptions.propTypes = {
    value: PropTypes.oneOf([0, 1, 2]),
    onChange: PropTypes.func.isRequired,
    invalid: PropTypes.bool,
};

export default React.memo(AnswerOptions);
