package com.kdsq.global.validation;

import java.time.Year;
import java.time.ZoneId;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class NotFutureYearValidator implements ConstraintValidator<NotFutureYear, Integer> {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Override
    public boolean isValid(Integer value, ConstraintValidatorContext context) {
        return value == null || value <= Year.now(KST).getValue();
    }
}
