package com.kdsq.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.kdsq.auth.RefreshTokenRepository;
import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.member.dto.MemberResponse;
import com.kdsq.member.dto.SignupRequest;

/**
 * MemberService 단위 테스트 (REST API 설계서 3.1.1 회원가입, 4.1 내 정보·탈퇴 / 7.4 TC-AUTH-01·02, TC-MEM)
 *
 * Repository·PasswordEncoder를 Mock으로 바꿔 DB 없이 서비스 규칙만 확인한다.
 */
@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    MemberRepository memberRepository;

    @Mock
    RefreshTokenRepository refreshTokenRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    MemberService memberService;

    private SignupRequest signupRequest() {
        return new SignupRequest("hong@test.com", "Test1234!", "홍길동", Gender.MALE, 1960);
    }

    /** DB에 저장된 것처럼 id가 있는 활성 회원 */
    private Member savedMember(Long id) {
        Member member = Member.create("hong@test.com", "encoded", "홍길동", Gender.MALE, 1960);
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }

    // ───────────────────── 회원가입 ─────────────────────

    @Test
    @DisplayName("회원가입: 비밀번호는 암호화해서 저장하고 MEMBER·ACTIVE로 만든다 (TC-AUTH-01)")
    void signup_success() {
        given(memberRepository.existsByEmail("hong@test.com")).willReturn(false);
        given(passwordEncoder.encode("Test1234!")).willReturn("encoded-password");

        MemberResponse response = memberService.signup(signupRequest());

        ArgumentCaptor<Member> saved = ArgumentCaptor.forClass(Member.class);
        verify(memberRepository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getPassword()).isEqualTo("encoded-password");   // 평문 저장 금지
        assertThat(saved.getValue().getRole()).isEqualTo(Role.MEMBER);
        assertThat(saved.getValue().getStatus()).isEqualTo(UserStatus.ACTIVE);

        assertThat(response.email()).isEqualTo("hong@test.com");
        assertThat(response.name()).isEqualTo("홍길동");
        assertThat(response.status()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("회원가입: 이미 가입된 이메일이면 DUPLICATE_EMAIL, 저장하지 않는다 (TC-AUTH-02)")
    void signup_duplicateEmail() {
        given(memberRepository.existsByEmail("hong@test.com")).willReturn(true);

        assertThatThrownBy(() -> memberService.signup(signupRequest()))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_EMAIL);
        verify(memberRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("회원가입: 동시에 같은 이메일로 가입해 DB unique 제약에 걸려도 DUPLICATE_EMAIL")
    void signup_uniqueConstraint_duplicateEmail() {
        given(memberRepository.existsByEmail("hong@test.com")).willReturn(false);
        given(passwordEncoder.encode("Test1234!")).willReturn("encoded-password");
        given(memberRepository.saveAndFlush(any(Member.class)))
                .willThrow(new DataIntegrityViolationException("uk_members_email"));

        assertThatThrownBy(() -> memberService.signup(signupRequest()))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_EMAIL);   // 500이 아니라 409
    }

    // ───────────────────── 내 정보 조회 ─────────────────────

    @Test
    @DisplayName("내 정보 조회: 활성 회원이면 회원 정보를 돌려준다")
    void getMyInfo_success() {
        given(memberRepository.findById(2L)).willReturn(Optional.of(savedMember(2L)));

        MemberResponse response = memberService.getMyInfo(2L);

        assertThat(response.id()).isEqualTo(2L);
        assertThat(response.email()).isEqualTo("hong@test.com");
    }

    @Test
    @DisplayName("내 정보 조회: 탈퇴한 회원은 없는 회원으로 보고 MEMBER_NOT_FOUND")
    void getMyInfo_withdrawn_notFound() {
        Member withdrawn = savedMember(2L);
        withdrawn.withdraw();
        given(memberRepository.findById(2L)).willReturn(Optional.of(withdrawn));

        assertThatThrownBy(() -> memberService.getMyInfo(2L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.MEMBER_NOT_FOUND);
    }

    // ───────────────────── 회원 탈퇴 ─────────────────────

    @Test
    @DisplayName("회원 탈퇴: 상태를 WITHDRAWN으로 바꾸고(소프트 삭제) 리프레시 토큰을 지운다")
    void withdraw_success() {
        Member member = savedMember(2L);
        given(memberRepository.findById(2L)).willReturn(Optional.of(member));

        memberService.withdraw(2L);

        assertThat(member.getStatus()).isEqualTo(UserStatus.WITHDRAWN);
        verify(refreshTokenRepository).deleteByMemberId(2L);   // 남은 토큰으로 재발급받지 못하게
    }

    @Test
    @DisplayName("회원 탈퇴: 이미 탈퇴한 회원이면 MEMBER_NOT_FOUND, 토큰 삭제도 하지 않는다")
    void withdraw_alreadyWithdrawn_notFound() {
        Member withdrawn = savedMember(2L);
        withdrawn.withdraw();
        given(memberRepository.findById(2L)).willReturn(Optional.of(withdrawn));

        assertThatThrownBy(() -> memberService.withdraw(2L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.MEMBER_NOT_FOUND);
        verify(refreshTokenRepository, never()).deleteByMemberId(anyLong());
    }
}
