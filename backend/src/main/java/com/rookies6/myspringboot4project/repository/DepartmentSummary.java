package com.rookies6.myspringboot4project.repository;

/**
 * 학과 목록 조회 결과를 담는 인터페이스.
 * <p>
 * Spring Data JPA 의 프로젝션(Projection) 기능으로, JPQL 의 별칭(AS)과
 * 아래 메서드 이름이 짝을 이루면 구현체를 자동으로 만들어 준다.
 * 학과 정보와 학생 수를 한 번의 쿼리로 함께 조회하기 위해 사용한다.
 */
public interface DepartmentSummary {

    Long getId();

    String getName();

    String getCode();

    /** 해당 학과에 속한 학생 수 */
    Long getStudentCount();
}