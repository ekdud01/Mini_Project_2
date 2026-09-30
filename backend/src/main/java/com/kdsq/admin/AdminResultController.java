package com.kdsq.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;

import com.kdsq.admin.dto.ResultSearchCondition;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 검사 결과 관리 (UI 설계서 4.6~4.7, 파트 분배 5.3)
 *
 * | 요청                                                            | 템플릿             | Model                |
 * |-----------------------------------------------------------------|--------------------|----------------------|
 * | GET  /admin/results?examType=&riskLevels=&name=&from=&to=&page= | admin/results/list | results(Page), cond  |
 */
@Controller
@RequestMapping("/admin/results")
@RequiredArgsConstructor
public class AdminResultController {

    private final AdminResultService adminResultService;

    /** ADM-05 검사 결과 목록 (20건씩, 검사일 최신순) */
    @GetMapping
    public String list(@ModelAttribute("cond") ResultSearchCondition cond, BindingResult bindingResult,
                       @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
                       Model model) {
        // BindingResult를 받으면 잘못된 값(없는 enum, 날짜 형식 오류)은 오류 페이지 대신 해당 조건만 비운 채(null) 조회된다
        // ※ BindingResult는 반드시 바인딩 대상(cond) "바로 뒤"에 와야 한다
        model.addAttribute("results", adminResultService.search(cond, pageable));
        return "admin/results/list";
    }
}
