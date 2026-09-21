package com.rookies6.myspringboot4project.repository;

import com.rookies6.myspringboot4project.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

//StudentRepository 인터페이스
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    //전체 목록을 상세정보/학과와 함께 조회한다 ( findAll() 의 N+1 문제를 해결 )
    @Query("SELECT s FROM Student s "
            + "LEFT JOIN FETCH s.studentDetail "
            + "LEFT JOIN FETCH s.department")
    List<Student> findAllWithDetails();

    //LEFT JOIN FETCH : 상세정보가 없는 학생도 조회되어야 하므로 외부 조인을 사용한다
    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.studentDetail WHERE s.id = :id")
    Optional<Student> findByIdWithStudentDetail(@Param("id") Long id);

    //ID 로 상세정보와 학과를 한 번에 조회한다
    @Query("SELECT s FROM Student s "
            + "LEFT JOIN FETCH s.studentDetail "
            + "LEFT JOIN FETCH s.department "
            + "WHERE s.id = :id")
    Optional<Student> findByIdWithAllDetails(@Param("id") Long id);

    //학번으로 조회할 때에도 상세정보/학과를 함께 가져와 쿼리 1번으로 처리한다
    @Query("SELECT s FROM Student s "
            + "LEFT JOIN FETCH s.studentDetail "
            + "LEFT JOIN FETCH s.department "
            + "WHERE s.studentNumber = :studentNumber")
    Optional<Student> findByStudentNumber(@Param("studentNumber") String studentNumber);

    //학과별 학생 목록도 상세정보/학과를 함께 조회한다
    @Query("SELECT s FROM Student s "
            + "LEFT JOIN FETCH s.studentDetail "
            + "LEFT JOIN FETCH s.department "
            + "WHERE s.department.id = :departmentId")
    List<Student> findByDepartmentId(@Param("departmentId") Long departmentId);

    //학과별 학생 수 ( 학과 하나를 대상으로 할 때 사용 )
    @Query("SELECT COUNT(s) FROM Student s WHERE s.department.id = :departmentId")
    Long countByDepartmentId(@Param("departmentId") Long departmentId);

    boolean existsByStudentNumber(String studentNumber);
}