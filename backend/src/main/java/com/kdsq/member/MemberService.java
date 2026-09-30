package com.kdsq.member;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kdsq.auth.RefreshTokenRepository;
import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.member.dto.MemberResponse;
import com.kdsq.member.dto.SignupRequest;

import lombok.RequiredArgsConstructor;

/**
 * 회원가입, 내 정보 조회, 회원 탈퇴 (REST API 설계서 3.1.1, 4.1)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    /** 회원가입: 항상 MEMBER·ACTIVE로 생성, 비밀번호는 BCrypt로 저장 */
    @Transactional
    public MemberResponse signup(SignupRequest request) {
        if (memberRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        Member member = Member.create(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.name(),
                request.gender(),
                request.birthYear());

        try {
            // 같은 이메일로 동시에 가입하면 위 검사를 둘 다 통과할 수 있어, DB unique 제약 위반도 409로 바꾼다
            memberRepository.saveAndFlush(member);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        return MemberResponse.from(member);
    }

    /** 내 정보 조회: 탈퇴한 회원은 없는 회원으로 본다 */
    public MemberResponse getMyInfo(Long memberId) {
        return MemberResponse.from(findActiveMember(memberId));
    }

    /** 회원 탈퇴: 소프트 삭제(ACTIVE → WITHDRAWN, 사유 SELF) + 리프레시 토큰 폐기. 검사 결과는 보존 */
    @Transactional
    public void withdraw(Long memberId) {
        Member member = findActiveMember(memberId);
        member.withdraw();
        refreshTokenRepository.deleteByMemberId(memberId);
    }

    private Member findActiveMember(Long memberId) {
        return memberRepository.findById(memberId)
                .filter(member -> member.getStatus().isActive())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }
}
