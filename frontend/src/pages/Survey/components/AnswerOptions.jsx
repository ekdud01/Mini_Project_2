/**
 * 답변 선택지
 * 아니다 = 0, 가끔(조금) 그렇다 = 1, 자주(많이) 그렇다 = 2
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
            className="grid-cols-1 gap-2 md:grid-cols-3"
        >
            {ANSWER_OPTIONS.map((option) => {
                const id = `${baseId}-${option.value}`;
                const selected = value === option.value;
                return (
                    <label
                        key={option.value}
                        htmlFor={id}
                        className={cn(
                            'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-base transition-colors hover:bg-accent',
                            selected && 'border-primary bg-primary/5 font-semibold',
                            invalid && !selected && 'border-destructive/50',
                        )}
                    >
                        <RadioGroupItem id={id} value={String(option.value)} />
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