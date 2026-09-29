package com.kdsq.admin;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.kdsq.admin.dto.AdminMemberUpdateForm;
import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.member.Member;
import com.kdsq.member.MemberRepository;
import com.kdsq.member.Role;
import com.kdsq.result.SurveyResult;
import com.kdsq.result.SurveyResultRepository;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 회원 관리 (UI 설계서 4.3~4.5, Entity 설계서 8.4.2)
 *
 * Entity(Member, SurveyResult)를 그대로 돌려준다 (대시보드 AdminStatisticsService와 같은 방식).
 * open-in-view=false여도 괜찮은 이유: Member는 LAZY 연관이 없고, 검사 이력은 @EntityGraph로 survey를 함께 가져온다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("hasRole('ADMIN')")   // 관리자만 호출 가능 (REST 설계서 3.3)
public class AdminMemberService {

    private final MemberRepository memberRepository;
    private final SurveyResultRepository surveyResultRepository;

    /** ADM-03 회원 목록: 일반 회원만, 이름/이메일 검색 + 페이징 */
    public Page<Member> getMembers(String keyword, Pageable pageable) {
        // 빈 검색어를 null로 바꿔야 JPQL의 (:keyword IS NULL OR ...)가 "전체 조회"로 동작한다
        String kw = StringUtils.hasText(keyword) ? keyword.trim() : null;
        return memberRepository.searchMembers(Role.MEMBER, kw, pageable);
    }

    /** ADM-04 회원 상세 / ADM-04-1 수정 폼 */
    public Member getMember(Long id) {
        return findMember(id);
    }

    /** ADM-04 회원 상세의 검사 이력: 삭제되지 않은 결과만, 최신순 */
    public List<SurveyResult> getResults(Long memberId) {
        findMember(memberId);   // 관리자 id·없는 id면 여기서 404
        return surveyResultRepository.findActiveByMemberId(memberId);
    }

    /**
     * ADM-04-1 수정 저장.
     * 이메일이 다른 회원과 겹치면 BusinessException(DUPLICATE_EMAIL) → 컨트롤러가 받아서 입력칸 아래에 표시
     */
    @Transactional
    public void update(Long id, AdminMemberUpdateForm form) {
        Member member = findMember(id);

        // "나(id)를 제외한 다른 회원이 이 이메일을 쓰고 있는지" 확인
        if (memberRepository.existsByEmailAndIdNot(form.getEmail(), id)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        member.updateInfo(form.getName(), form.getEmail(), form.getGender(), form.getBirthYear());
        // save()를 부르지 않아도 된다: 변경 감지(dirty checking)로 트랜잭션이 끝날 때 UPDATE

        try {
            // 두 관리자가 동시에 같은 이메일로 바꾸는 경우 → DB unique 제약 위반도 같은 오류로 바꾼다
            memberRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
    }

    /** 일반 회원만 찾는다. 없는 id·관리자 id면 MEMBER_NOT_FOUND → AdminExceptionHandler가 404 화면으로 */
    private Member findMember(Long id) {
        return memberRepository.findById(id)
                .filter(member -> member.getRole() == Role.MEMBER)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }
}
