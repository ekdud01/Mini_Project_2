package com.kdsq.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 회원 관리 (UI 설계서 4.3~4.5, 파트 분배 5.3)
 *
 * | 요청                                  | 템플릿                 | Model                                 |
 * |---------------------------------------|------------------------|---------------------------------------|
 * | GET  /admin/members?keyword=&page=    | admin/members/list     | members(Page), keyword                |
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
}
