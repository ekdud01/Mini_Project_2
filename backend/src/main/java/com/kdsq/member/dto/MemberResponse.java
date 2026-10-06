package com.kdsq.member.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.kdsq.member.Gender;
import com.kdsq.member.Member;
import com.kdsq.member.UserStatus;

/**
 * 회원 정보 응답 (REST API 설계서 3.1.1, 4.1.1). 비밀번호·권한은 내보내지 않는다.
 */
public record MemberResponse(
        Long id,
        String email,
        String name,
        Gender gender,
        Integer birthYear,
        UserStatus status,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime createdAt
) {
    public static MemberResponse from(Member member) {
        return new MemberResponse(
                member.getId(),
                member.getEmail(),
                member.getName(),
                member.getGender(),
                member.getBirthYear(),
                member.getStatus(),
                member.getCreatedAt());
    }
}
