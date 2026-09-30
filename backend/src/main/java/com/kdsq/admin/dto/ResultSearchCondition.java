package com.kdsq.admin.dto;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;

import com.kdsq.member.UserStatus;
import com.kdsq.result.RiskLevel;
import com.kdsq.survey.ExamType;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * ADM-05 검사 결과 검색 조건 (Model 이름: cond, Entity 설계서 8.4.1)
 * GET /admin/results?examType=KDSQ_C&riskLevels=Borderline&riskLevels=HighRisk&name=홍&memberStatus=WITHDRAWN&from=2026-09-01&to=2026-09-30
 *
 * 쿼리 파라미터 이름 = 필드 이름. 컨트롤러가 @ModelAttribute("cond")로 받으면 Model에도 자동으로 담겨,
 * 검색 후 화면에서 입력칸·체크박스 값이 그대로 남는다 (검색 조건 유지).
 * page는 여기 두지 않는다: 컨트롤러의 @PageableDefault Pageable이 받고, 페이지 링크는 PageUrl이 만든다.
 */
@Getter
@Setter
@NoArgsConstructor
public class ResultSearchCondition {

    private ExamType examType;            // ?examType=KDSQ_P | KDSQ_C (빈 값 = 전체)

    private List<RiskLevel> riskLevels;   // ?riskLevels=Borderline&riskLevels=HighRisk (체크박스, 없으면 전체)

    private String name;                  // 회원 이름 일부

    private UserStatus memberStatus;      // ?memberStatus=ACTIVE | WITHDRAWN (빈 값 = 전체, 결과 삭제 여부 active와는 별개)

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)   // <input type="date">가 보내는 yyyy-MM-dd 형식
    private LocalDate from;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate to;
}
