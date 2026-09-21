package com.rookies6.myspringboot4project.controller.dto;

import com.rookies6.myspringboot4project.entity.Student;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// StudentDTO
public class StudentDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotBlank(message = "Student name is required")
        @Size(max = 100, message = "Student name cannot exceed 100 characters")
        private String name;

        @NotBlank(message = "Student number is required")
        @Size(max = 20, message = "Student number cannot exceed 20 characters")
        private String studentNumber;

        @NotNull(message = "Department ID is required")
        private Long departmentId;

        @Valid
        private StudentDetailDTO detailRequest;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentDetailDTO {
        // 엔티티에서 null 을 허용하는 선택 입력 항목이므로 필수 검증을 하지 않는다
        @Size(max = 200, message = "Address cannot exceed 200 characters")
        private String address;

        // 엔티티에서 NOT NULL, UNIQUE 이므로 필수 항목이다
        @NotBlank(message = "Phone number is required")
        @Size(max = 20, message = "Phone number cannot exceed 20 characters")
        private String phoneNumber;

        // 엔티티에서 NOT NULL, UNIQUE 이므로 필수이며 형식도 검증한다
        @NotBlank(message = "Email is required")
        @Email(message = "Email format is invalid")
        @Size(max = 100, message = "Email cannot exceed 100 characters")
        private String email;

        private LocalDate dateOfBirth;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String studentNumber;
        private DepartmentDTO.SimpleResponse department;
        private StudentDetailResponse detail;

        public static Response fromEntity(Student student) {
            // 학과는 기본 정보만 담는다. 학과별 학생 수는 학과 조회 API 가 제공한다.
            DepartmentDTO.SimpleResponse departmentResponse = student.getDepartment() != null
                    ? DepartmentDTO.SimpleResponse.fromEntity(student.getDepartment())
                    : null;

            StudentDetailResponse detailResponse = student.getStudentDetail() != null
                    ? StudentDetailResponse.builder()
                    .id(student.getStudentDetail().getId())
                    .address(student.getStudentDetail().getAddress())
                    .phoneNumber(student.getStudentDetail().getPhoneNumber())
                    .email(student.getStudentDetail().getEmail())
                    .dateOfBirth(student.getStudentDetail().getDateOfBirth())
                    .build()
                    : null;

            return Response.builder()
                    .id(student.getId())
                    .name(student.getName())
                    .studentNumber(student.getStudentNumber())
                    .department(departmentResponse)
                    .detail(detailResponse)
                    .build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimpleResponse {
        private Long id;
        private String name;
        private String studentNumber;

        public static SimpleResponse fromEntity(Student student) {
            return SimpleResponse.builder()
                    .id(student.getId())
                    .name(student.getName())
                    .studentNumber(student.getStudentNumber())
                    .build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentDetailResponse {
        private Long id;
        private String address;
        private String phoneNumber;
        private String email;
        private LocalDate dateOfBirth;
    }
}