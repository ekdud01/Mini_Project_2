package com.kdsq.member;

import com.kdsq.global.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 회원 (Entity 설계서 4.1). 사용자(MEMBER)와 관리자(ADMIN) 계정을 role로 구분한다.
 * 검사 결과 목록은 매핑하지 않는다 (SurveyResult → Member 단방향, 4.1.3).
 */
@Entity
@Table(name = "members")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Member extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;   // BCrypt 암호화

    @Column(nullable = false, length = 50)
    private String name;       // 환자명 (관리자는 이름)

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;     // ADMIN은 null

    @Column(name = "birth_year")
    private Integer birthYear; // ADMIN은 null

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.MEMBER;

    /** 회원가입: 항상 MEMBER, ACTIVE로 생성 */
    public static Member create(String email, String encodedPassword, String name,
                                Gender gender, Integer birthYear) {
        Member member = new Member();
        member.email = email;
        member.password = encodedPassword;
        member.name = name;
        member.gender = gender;
        member.birthYear = birthYear;
        member.status = UserStatus.ACTIVE;
        member.role = Role.MEMBER;
        return member;
    }

    /** 관리자 계정: 초기 데이터(AdminInitializer)에서만 호출. 환자 정보(성별·출생년도)는 없음 */
    public static Member createAdmin(String email, String encodedPassword, String name) {
        Member admin = new Member();
        admin.email = email;
        admin.password = encodedPassword;
        admin.name = name;
        admin.status = UserStatus.ACTIVE;
        admin.role = Role.ADMIN;
        return admin;
    }

    /** 본인 탈퇴 / 관리자 탈퇴 처리 (소프트 삭제) */
    public void withdraw() {
        this.status = UserStatus.WITHDRAWN;
    }

    /** 관리자 화면(ADM-04-1)에서만 호출. 이메일 중복 검사는 서비스에서 먼저 수행 */
    public void updateInfo(String name, String email, Gender gender, Integer birthYear) {
        this.name = name;
        this.email = email;
        this.gender = gender;
        this.birthYear = birthYear;
    }
}
