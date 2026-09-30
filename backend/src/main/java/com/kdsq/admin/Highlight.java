package com.kdsq.admin;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

/**
 * 검색어 하이라이트 도우미 (UI 설계서 2.5 "검색어 하이라이트")
 *
 * 템플릿에서 ${@highlight.mark(값, 검색어)} 로 부르고, 결과는 th:utext 로 출력한다.
 *   mark("홍길동", "길동") → "홍<mark>길동</mark>"
 *
 * ⚠ 보안이 핵심인 클래스
 *  th:utext는 HTML 태그를 그대로 실행한다. 회원 이름에 <script>가 들어 있으면 관리자 화면에서 실행될 수 있다(XSS).
 *  그래서 순서가 중요하다: ① 원래 글자를 먼저 이스케이프(안전한 글자로 변환) → ② 그다음 <mark>만 붙인다.
 */
@Component("highlight")
public class Highlight {

    public String mark(String text, String keyword) {
        if (text == null) {
            return "";
        }

        String escaped = HtmlUtils.htmlEscape(text);

        if (!StringUtils.hasText(keyword)) {
            return escaped;   // 검색어가 없으면 강조 없이 (이스케이프된) 글자만
        }

        String kw = HtmlUtils.htmlEscape(keyword.trim());   // 검색어도 같은 방식으로 이스케이프해야 서로 비교가 맞다
        return Pattern.compile(Pattern.quote(kw), Pattern.CASE_INSENSITIVE)   // 검색이 대소문자 무시 → 강조도 무시
                .matcher(escaped)
                .replaceAll(m -> "<mark>" + Matcher.quoteReplacement(m.group()) + "</mark>");
    }
}
