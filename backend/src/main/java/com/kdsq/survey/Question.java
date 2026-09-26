package com.kdsq.survey;

import com.kdsq.global.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 문항 (Entity 설계서 4.2). 같은 설문 안에서 문항 번호는 중복될 수 없다.
 */
@Entity
@Table(name = "questions",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_question_survey_number",
                columnNames = {"survey_id", "question_number"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Question extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @Column(name = "question_number", nullable = false)
    private Integer questionNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
}
