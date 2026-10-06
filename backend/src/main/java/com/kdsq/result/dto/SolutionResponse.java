package com.kdsq.result.dto;

import com.kdsq.result.Solution;

/** 관리 안내 (REST API 설계서 4.3.3 solutions) */
public record SolutionResponse(Long id, String title, String content) {

    public static SolutionResponse from(Solution solution) {
        return new SolutionResponse(solution.getId(), solution.getTitle(), solution.getContent());
    }
}
