package com.kdsq.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.kdsq.admin.dto.AdminMemberUpdateForm;
import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.member.Member;
import com.kdsq.member.UserStatus;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 관리자 회원 관리 (UI 설계서 4.3~4.5, 파트 분배 5.3)
 *
 * | 요청                                  | 템플릿                 | Model                                  |
 * |---------------------------------------|------------------------|---------------------------------------|
 * | GET  /admin/members?keyword=&status=&page= | admin/members/list | members(Page), keyword, status       |
 * | GET  /admin/members/{id}              | admin/members/detail   | member, results                       |
 * | GET·POST /admin/members/{id}/edit     | admin/members/edit     | form, memberId, member                |
 * | POST /admin/members/{id}/withdraw     | → 상세로 redirect      | 플래시 successMessage / errorMessage   |
 *
 * 없는 회원·관리자 id → 서비스의 BusinessException(MEMBER_NOT_FOUND) → AdminExceptionHandler가 error/404
 */
@Controller
@RequestMapping("/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final AdminMemberService adminMemberService;

    /** ADM-03 회원 목록 (20건씩, 가입일 최신순, 상태 필터) */
    @GetMapping
    public String list(@RequestParam(required = false) String keyword,
                       @RequestParam(required = false) UserStatus status,
                       @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
                       Model model) {
        model.addAttribute("members", adminMemberService.getMembers(keyword, status, pageable));
        model.addAttribute("keyword", StringUtils.hasText(keyword) ? keyword.trim() : null);  // 검색창 유지 + 하이라이트
        model.addAttribute("status", status);
        return "admin/members/list";
    }

    /** ADM-04 회원 상세 + 검사 이력 */
    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        model.addAttribute("member", adminMemberService.getMember(id));
        model.addAttribute("results", adminMemberService.getResults(id));
        return "admin/members/detail";
    }

    /** ADM-04-1 수정 폼 */
    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable Long id, Model model) {
        Member member = adminMemberService.getMember(id);
        model.addAttribute("form", AdminMemberUpdateForm.from(member));
        return showEditForm(id, member, model);
    }

    /** ADM-04-1 수정 저장 */
    @PostMapping("/{id}/edit")
    public String update(@PathVariable Long id,
                         @Valid @ModelAttribute("form") AdminMemberUpdateForm form, BindingResult bindingResult,
                         Model model, RedirectAttributes redirectAttributes) {
        Member member = adminMemberService.getMember(id);   // 없는 회원이면 검증보다 먼저 404

        if (bindingResult.hasErrors()) {
            return showEditForm(id, member, model);
        }

        try {
            adminMemberService.update(id, form);
        } catch (BusinessException e) {
            if (e.getErrorCode() != ErrorCode.DUPLICATE_EMAIL) {
                throw e;   // 이메일 중복이 아닌 오류는 그대로 → AdminExceptionHandler
            }
            // 예외 페이지가 아니라 입력칸 아래에 표시 (UI 2.5 마지막 줄, 4.5)
            bindingResult.rejectValue("email", "duplicate", "이미 사용 중인 이메일입니다");   // 화면 문구는 끝 마침표 없음 (UI 설계서 2.4)
            return showEditForm(id, member, model);
        }

        // PRG 패턴: 저장 후 redirect, 메시지는 플래시로 1회만 전달
        redirectAttributes.addFlashAttribute("successMessage", "회원 정보가 수정되었습니다");
        return "redirect:/admin/members/" + id;
    }

    /** 탈퇴 처리 (소프트 삭제 + 리프레시 토큰 폐기) */
    @PostMapping("/{id}/withdraw")
    public String withdraw(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            adminMemberService.withdraw(id);
            redirectAttributes.addFlashAttribute("successMessage", "탈퇴 처리되었습니다");
        } catch (BusinessException e) {
            if (e.getErrorCode() == ErrorCode.MEMBER_NOT_FOUND) {
                throw e;   // 없는 회원·관리자 id → 404 화면
            }
            // 실패 플래시 (UI 4.4): 이미 탈퇴한 회원은 이유를 알려주고, 그 밖의 실패는 공통 문구
            String message = (e.getErrorCode() == ErrorCode.MEMBER_WITHDRAWN)
                    ? "이미 탈퇴한 회원입니다"
                    : "처리 중 오류가 발생했습니다";
            redirectAttributes.addFlashAttribute("errorMessage", message);
        }
        return "redirect:/admin/members/" + id;
    }

    /** 수정 화면에 필요한 Model (form은 이미 담겨 있음). 검증 실패로 다시 보여줄 때도 memberId·member를 다시 담는다 */
    private String showEditForm(Long id, Member member, Model model) {
        model.addAttribute("memberId", id);
        model.addAttribute("member", member);   // 가입일·상태(읽기 전용) 표시용
        return "admin/members/edit";
    }
}
