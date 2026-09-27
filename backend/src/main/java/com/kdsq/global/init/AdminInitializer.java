package com.kdsq.global.init;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.kdsq.member.Member;
import com.kdsq.member.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 관리자 계정 등록 (Entity 설계서 12.1).
 * 관리자는 회원가입으로 만들 수 없으므로, 서버 시작 시 app.admin.* 설정값으로 한 번 등록한다.
 * 비밀번호를 BCrypt로 암호화해야 해서 data.sql 대신 여기서 처리한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInitializer implements ApplicationRunner {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (memberRepository.existsByEmail(adminEmail)) {
            return;
        }
        memberRepository.save(Member.createAdmin(adminEmail, passwordEncoder.encode(adminPassword), "관리자"));
        log.info("관리자 계정을 등록했습니다: {}", adminEmail);
    }
}
