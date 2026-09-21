package com.rookies6.myspringboot4project.exception.advice;

import lombok.Data;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Data
public class ErrorObject {
    // 에러 코드
    private Integer statusCode;
    // 에러 메시지
    private String message;
    // 에러 발생시간
    private String timestamp;

    public String getTimestamp() {
        LocalDateTime ldt = LocalDateTime.now();
        return DateTimeFormatter.ofPattern(
                "yyyy-MM-dd HH:mm:ss E a",  // 연-월-일 시:분:초 요일 오전/오후
                Locale.KOREA).format(ldt);
    }
}