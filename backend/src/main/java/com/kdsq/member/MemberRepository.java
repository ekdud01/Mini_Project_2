package com.kdsq.member;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 회원 조회 (Entity 설계서 8.4.2).
 * 관리자 화면(이원구)·대시보드에서 쓰는 메서드도 함께 둔다. 필요한 메서드가 더 있으면 추가해도 된다.
 */
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);            // 로그인 (사용자·관리자 공통)

    boolean existsByEmail(String email);                   // 회원가입 이메일 중복 → DUPLICATE_EMAIL

    boolean existsByEmailAndIdNot(String email, Long id);  // 관리자 회원정보 수정 시 다른 회원과 이메일 중복 확인

    long countByRoleAndStatus(Role role, UserStatus status);  // 대시보드 전체 회원 수(활성)

    /** ADM-03 회원 목록: 일반 회원만, 이름/이메일 검색 + 페이징. 빈 검색어는 서비스에서 null로 바꿔 넘긴다 */
    @Query("SELECT m FROM Member m WHERE m.role = :role "
            + "AND (:keyword IS NULL OR m.name LIKE CONCAT('%', :keyword, '%') "
            + "OR m.email LIKE CONCAT('%', :keyword, '%'))")
    Page<Member> searchMembers(@Param("role") Role role,
                               @Param("keyword") String keyword,
                               Pageable pageable);
}
