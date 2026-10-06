package com.kdsq.member;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kdsq.global.common.ApiResponse;
import com.kdsq.global.security.SecurityUtil;
import com.kdsq.member.dto.MemberResponse;
import com.kdsq.member.dto.SignupRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 회원 API (REST API 설계서 3.1.1, 4.1)
 *  - POST   /api/members     회원가입 (인증 불필요)
 *  - GET    /api/members/me  내 정보 조회
 *  - DELETE /api/members/me  회원 탈퇴
 * 회원정보 수정 API는 없다 (관리자 화면에서만 수정).
 */
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @PostMapping
    public ResponseEntity<ApiResponse<MemberResponse>> signup(@Valid @RequestBody SignupRequest request) {
        MemberResponse response = memberService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "회원가입이 완료되었습니다"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MemberResponse>> getMyInfo() {
        return ResponseEntity.ok(ApiResponse.ok(memberService.getMyInfo(SecurityUtil.currentMemberId())));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> withdraw() {
        memberService.withdraw(SecurityUtil.currentMemberId());
        return ResponseEntity.noContent().build();
    }
}
