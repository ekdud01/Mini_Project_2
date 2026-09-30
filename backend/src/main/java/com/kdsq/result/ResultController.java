package com.kdsq.result;

import java.net.URI;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.kdsq.global.common.ApiResponse;
import com.kdsq.global.common.PageResponse;
import com.kdsq.global.security.SecurityUtil;
import com.kdsq.result.dto.ResultResponse;
import com.kdsq.result.dto.ResultSubmitRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 검사 결과 API (REST API 설계서 4.3). 모두 로그인한 회원(MEMBER)만 호출할 수 있다.
 *  - POST /api/results                검사 결과 제출 → 201 + Location
 *  - GET  /api/results/{resultId}     결과 상세 (본인 결과만)
 *  - GET  /api/members/me/results     내 검사 이력 (주소는 /api/members지만 결과 기능이라 여기에 둔다, Entity 설계서 1.4)
 * 회원 id는 요청 본문이 아니라 토큰에서 꺼낸다 (다른 회원 id로 저장·조회하지 못하게).
 */
@RestController
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;

    @PostMapping("/api/results")
    public ResponseEntity<ApiResponse<ResultResponse>> submit(@Valid @RequestBody ResultSubmitRequest request) {
        ResultResponse saved = resultService.submit(SecurityUtil.currentMemberId(), request);
        return ResponseEntity.created(URI.create("/api/results/" + saved.id()))
                .body(ApiResponse.ok(saved, "검사가 완료되었습니다"));
    }

    @GetMapping("/api/results/{resultId}")
    public ResponseEntity<ApiResponse<ResultResponse>> getMyResult(@PathVariable Long resultId) {
        return ResponseEntity.ok(ApiResponse.ok(resultService.getMyResult(SecurityUtil.currentMemberId(), resultId)));
    }

    @GetMapping("/api/members/me/results")
    public ResponseEntity<ApiResponse<PageResponse<ResultResponse>>> getMyResults(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(resultService.getMyResults(SecurityUtil.currentMemberId(), pageable)));
    }
}
