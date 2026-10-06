package com.kdsq.global.common;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/**
 * 목록 응답의 data 형식 (REST API 설계서 2.5)
 * { "content": [...], "page": { "number", "size", "totalElements", "totalPages", "first", "last" } }
 *
 * 사용 예) PageResponse.of(resultPage, ResultResponse::from)
 */
public record PageResponse<T>(List<T> content, PageInfo page) {

    public record PageInfo(int number, int size, long totalElements, int totalPages, boolean first, boolean last) {
    }

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        List<T> content = page.getContent().stream().map(mapper).toList();
        PageInfo info = new PageInfo(page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages(), page.isFirst(), page.isLast());
        return new PageResponse<>(content, info);
    }
}
