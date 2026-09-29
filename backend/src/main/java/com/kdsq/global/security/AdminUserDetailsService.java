package com.kdsq.global.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.kdsq.member.Member;
import com.kdsq.member.MemberRepository;
import com.kdsq.member.Role;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 로그인(formLogin) 계정 조회 (REST API 설계서 3.3 "계정 조회")
 *  - 사용자 이름 = 이메일
 *  - role = ADMIN인 계정만 인정. 일반 회원은 없는 계정으로 처리 → /admin/login?error
 *  - 탈퇴(WITHDRAWN) 계정은 비활성(disabled) → 로그인 실패
 * 사용자 API(/api/**)는 이 클래스를 쓰지 않는다 (JWT + AuthService).
 */
@Service
@RequiredArgsConstructor
public class AdminUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Member admin = memberRepository.findByEmail(email)
                .filter(member -> member.getRole() == Role.ADMIN)
                .orElseThrow(() -> new UsernameNotFoundException("관리자 계정이 아닙니다"));

        return User.withUsername(admin.getEmail())
                .password(admin.getPassword())
                .roles(Role.ADMIN.name())                  // → ROLE_ADMIN
                .disabled(!admin.getStatus().isActive())
                .build();
    }
}
