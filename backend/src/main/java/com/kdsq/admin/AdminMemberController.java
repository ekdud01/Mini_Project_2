package com.kdsq.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 회원 관리 (UI 설계서 4.3~4.5, 파트 분배 5.3)
 *
 * | 요청                                  | 템플릿                 | Model                                 |
 * |---------------------------------------|------------------------|---------------------------------------|
 * | GET  /admin/members?keyword=&page=    | admin/members/list     | members(Page), keyword                |
 * | GET  /admin/members/{id}              | admin/members/detail   | member, results                       |
 *
 * 없는 회원·관리자 id → 서비스의 BusinessException(MEMBER_NOT_FOUND) → AdminExceptionHandler가 error/404
 */
@Controller
@RequestMapping("/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final AdminMemberService adminMemberService;

    /** ADM-03 회원 목록 (20건씩, 가입일 최신순) */
    @GetMapping
    public String list(@RequestParam(required = false) String keyword,
                       @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
                       Model model) {
        model.addAttribute("members", adminMemberService.getMembers(keyword, pageable));
        model.addAttribute("keyword", StringUtils.hasText(keyword) ? keyword.trim() : null);  // 검색창 유지 + 하이라이트
        return "admin/members/list";
    }

    /** ADM-04 회원 상세 + 검사 이력 */
    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        model.addAttribute("member", adminMemberService.getMember(id));
        model.addAttribute("results", adminMemberService.getResults(id));
        return "admin/members/detail";
    }
}
