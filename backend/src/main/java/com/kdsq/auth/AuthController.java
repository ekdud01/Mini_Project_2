package com.kdsq.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kdsq.auth.dto.LoginRequest;
import com.kdsq.auth.dto.ReissueRequest;
import com.kdsq.auth.dto.TokenResponse;
import com.kdsq.global.common.ApiResponse;
import com.kdsq.global.security.SecurityUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 인증 API (REST API 설계서 3.1.2~3.1.4)
 *  - POST /api/auth/login    로그인 (인증 불필요)
 *  - POST /api/auth/reissue  액세스 토큰 재발급 (인증 불필요)
 *  - POST /api/auth/logout   로그아웃 (액세스 토큰 필요)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request), "로그인이 성공하였습니다"));
    }

    @PostMapping("/reissue")
    public ResponseEntity<ApiResponse<TokenResponse>> reissue(@Valid @RequestBody ReissueRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.reissue(request)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        authService.logout(SecurityUtil.currentMemberId());
        return ResponseEntity.noContent().build();
    }
}
