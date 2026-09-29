package com.kdsq.admin;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * 목록 페이지 링크 도우미 (UI 설계서 2.5 "페이지네이션")
 *
 * 템플릿(fragments/pagination.html, admin/results/list.html)에서 이렇게 부른다.
 *   ${@pageUrl.to(i)}      → 검색 조건은 그대로 두고 page만 i로 바꾼 주소
 *   ${@pageUrl.current()}  → 지금 보고 있는 목록 주소 그대로 (returnUrl 용)
 *
 * 왜 이렇게 쓰나요?
 *  - "위험 + 이번 달"로 검색한 뒤 2페이지를 눌러도 조건이 풀리지 않게 하려면,
 *    현재 주소의 쿼리(examType, riskLevels, keyword ...)는 그대로 두고 page만 바꿔야 한다.
 *  - 회원 목록·검사 결과 목록이 같은 페이지네이션 조각 하나를 쓰게 된다.
 */

@Component("pageUrl")
public class PageUrl {

    /** 현재 요청 주소에서 page 값만 바꾼 링크 (예: /admin/results?riskLevels=HighRisk&page=2) */
    public String to(int page) {
        return ServletUriComponentsBuilder.fromCurrentRequest()
                .scheme(null).host(null).port(null)   // http://localhost:8080 은 빼고 경로(/admin/...)부터만 남긴다
                .replaceQueryParam("page", page)
                .build(true)                          // 요청 주소는 이미 인코딩되어 있으므로 다시 인코딩하지 않는다
                .toUriString();
    }

    /** 현재 목록 주소 그대로 (검색 조건·page 포함). 상세 이동·삭제 후 돌아올 주소(returnUrl)로 쓴다 */
    public String current() {
        return ServletUriComponentsBuilder.fromCurrentRequest()
                .scheme(null).host(null).port(null)
                .build(true)
                .toUriString();
    }
}
