package com.kdsq.survey;

import java.util.ArrayList;
import java.util.List;

import com.kdsq.global.common.BaseEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 설문지 (Entity 설계서 4.2). KDSQ-P, KDSQ-C 두 개만 존재 (data.sql로 등록)
 */
@Entity
@Table(name = "surveys")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Survey extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false, unique = true)
    private ExamType examType;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("questionNumber ASC")
    private List<Question> questions = new ArrayList<>();

    /** 설문 생성 (초기 데이터·테스트용). 실제 설문은 data.sql로 등록 */
    public static Survey create(ExamType examType, String title, String description) {
        Survey survey = new Survey();
        survey.examType = examType;
        survey.title = title;
        survey.description = description;
        return survey;
    }
}
