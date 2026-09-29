package com.kdsq.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.kdsq.admin.dto.AdminMemberUpdateForm;
import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.member.Gender;
import com.kdsq.member.Member;
import com.kdsq.member.MemberRepository;
import com.kdsq.result.SurveyResultRepository;

/**
 * AdminMemberService 단위 테스트.
 *
 * 왜 Mockito로 하나요?
 *  - Repository를 "가짜(Mock)"로 바꿔서 DB·서버·템플릿 없이 서비스 규칙만 빠르게 확인한다.
 *  - given(...).willReturn(...) : 가짜 Repository가 이렇게 대답하도록 미리 정해 둔다
 *  - verify(...)                : 서비스가 Repository 메서드를 실제로 호출했는지 확인한다
 *
 * 실행: 클래스 이름 옆 ▶ 또는 터미널에서 gradlew.bat test
 */
@ExtendWith(MockitoExtension.class)
class AdminMemberServiceTest {

    @Mock
    MemberRepository memberRepository;

    @Mock
    SurveyResultRepository surveyResultRepository;

    @InjectMocks   // 위의 가짜 Repository 2개를 생성자에 넣어서 진짜 서비스를 만든다
    AdminMemberService adminMemberService;

    private Member member() {
        return Member.create("hong@test.com", "encoded", "홍길동", Gender.MALE, 1960);
    }

    private Member admin() {
        return Member.createAdmin("admin@kdsq.com", "encoded", "관리자");
    }

    // ───────────────────── 상세 조회 ─────────────────────

    @Test
    @DisplayName("관리자 id로 조회하면 MEMBER_NOT_FOUND (관리자는 회원 관리 대상이 아님)")
    void getMember_admin_notFound() {
        given(memberRepository.findById(1L)).willReturn(Optional.of(admin()));

        assertThatThrownBy(() -> adminMemberService.getMember(1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                // 관리자 id는 없는 회원과 같은 MEMBER_NOT_FOUND로 처리한다
                .isEqualTo(ErrorCode.MEMBER_NOT_FOUND);
    }

    @Test
    @DisplayName("없는 id로 조회하면 MEMBER_NOT_FOUND")
    void getMember_notExists_notFound() {
        given(memberRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> adminMemberService.getMember(999L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.MEMBER_NOT_FOUND);
    }

    // ───────────────────── 수정 ─────────────────────

    @Test
    @DisplayName("다른 회원이 쓰는 이메일로 바꾸면 DUPLICATE_EMAIL")
    void update_duplicateEmail() {
        given(memberRepository.findById(2L)).willReturn(Optional.of(member()));
        given(memberRepository.existsByEmailAndIdNot("kim@test.com", 2L)).willReturn(true);

        AdminMemberUpdateForm form = form("홍길동", "kim@test.com");

        assertThatThrownBy(() -> adminMemberService.update(2L, form))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_EMAIL);
    }

    @Test
    @DisplayName("정상 수정: Entity 값이 바뀐다 (save 없이 변경 감지로 저장)")
    void update_success() {
        Member member = member();
        given(memberRepository.findById(2L)).willReturn(Optional.of(member));
        given(memberRepository.existsByEmailAndIdNot("new@test.com", 2L)).willReturn(false);

        adminMemberService.update(2L, form("홍길순", "new@test.com"));

        assertThat(member.getName()).isEqualTo("홍길순");
        assertThat(member.getEmail()).isEqualTo("new@test.com");
    }

    private AdminMemberUpdateForm form(String name, String email) {
        AdminMemberUpdateForm form = new AdminMemberUpdateForm();
        form.setName(name);
        form.setEmail(email);
        form.setGender(Gender.MALE);
        form.setBirthYear(1960);
        return form;
    }
}
