package com.kdsq.admin;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.RequiredArgsConstructor;

/** ADM-02 관리자 대시보드 (UI 설계서 4.2). 관리자 로그인 성공 후 처음 보는 화면 */
@Controller
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminStatisticsService adminStatisticsService;

    @GetMapping("/admin/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("stats", adminStatisticsService.getDashboard());
        return "admin/dashboard";
    }
}
