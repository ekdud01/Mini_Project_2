package com.kdsq.admin.dto;

import com.kdsq.member.Gender;
import com.kdsq.member.Member;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * ADM-04-1 회원 정보 수정 폼 (Model 이름: form)
 * 수정 가능한 4개 필드만 둔다. 가입일·상태는 읽기 전용이라 넣지 않는다 (폼에 있으면 요청으로 조작될 수 있음).
 * @ModelAttribute 바인딩은 기본 생성자 + setter로 값을 채우므로 @NoArgsConstructor + @Setter가 필요하다.
 */
@Getter
@Setter
@NoArgsConstructor
public class AdminMemberUpdateForm {

    @NotBlank(message = "이름을 입력해 주세요.")
    @Size(max = 50, message = "이름은 50자 이하로 입력해 주세요.")      // members.name length = 50
    private String name;

    @NotBlank(message = "이메일을 입력해 주세요.")
    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @Size(max = 100, message = "이메일은 100자 이하로 입력해 주세요.")  // members.email length = 100
    private String email;

    @NotNull(message = "성별을 선택해 주세요.")
    private Gender gender;

    @NotNull(message = "출생년도를 입력해 주세요.")
    @Min(value = 1900, message = "출생년도를 올바르게 입력해 주세요.")
    @Max(value = 2100, message = "출생년도를 올바르게 입력해 주세요.")
    private Integer birthYear;

    /** 앞뒤 공백 제거 — " hong@test.com"처럼 공백으로 중복 검사를 피해 가지 못하게 */
    public void setName(String name) {
        this.name = (name == null) ? null : name.trim();
    }

    public void setEmail(String email) {
        this.email = (email == null) ? null : email.trim();
    }

    /** GET 수정 폼: 기존 값을 채워서 보여준다 */
    public static AdminMemberUpdateForm from(Member member) {
        AdminMemberUpdateForm form = new AdminMemberUpdateForm();
        form.setName(member.getName());
        form.setEmail(member.getEmail());
        form.setGender(member.getGender());
        form.setBirthYear(member.getBirthYear());
        return form;
    }
}
