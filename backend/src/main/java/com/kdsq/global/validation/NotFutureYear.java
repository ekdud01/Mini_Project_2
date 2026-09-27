package com.kdsq.global.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * 연도(Integer)가 올해(한국 시간)보다 크지 않은지 검사한다. null은 통과 (@NotNull과 함께 사용).
 * 예) 출생년도 — REST API 설계서 3.1.1 "1900 ~ 현재연도"
 */
@Documented
@Constraint(validatedBy = NotFutureYearValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface NotFutureYear {

    String message() default "올해 이후의 연도는 입력할 수 없습니다";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
