package com.kdsq.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.kdsq.member.Member;
import com.kdsq.member.MemberRepository;
import com.kdsq.member.Role;

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

    /** ADM-03 회원 목록: 일반 회원만, 이름/이메일 검색 + 페이징 */
    public Page<Member> getMembers(String keyword, Pageable pageable) {
        // 빈 검색어를 null로 바꿔야 JPQL의 (:keyword IS NULL OR ...)가 "전체 조회"로 동작한다
        String kw = StringUtils.hasText(keyword) ? keyword.trim() : null;
        return memberRepository.searchMembers(Role.MEMBER, kw, pageable);
    }
}
