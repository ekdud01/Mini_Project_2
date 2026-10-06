package com.kdsq.global.common;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 실행 확인용 API. 서버가 뜨고 공통 응답 형식이 동작하는지 확인한다.
 * GET http://localhost:8080/api/health
 */
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public ApiResponse<Map<String, String>> health() {
        return ApiResponse.ok(Map.of("status", "UP"), "서버가 정상 동작 중입니다");
    }
}
