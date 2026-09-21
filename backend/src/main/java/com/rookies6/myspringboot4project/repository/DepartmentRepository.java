package com.rookies6.myspringboot4project.repository;

import com.rookies6.myspringboot4project.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    
    Optional<Department> findByCode(String code);
    
    // 학과 목록과 학생 수를 한 번의 쿼리로 함께 조회한다.
    // LEFT JOIN 이므로 학생이 없는 학과도 studentCount = 0 으로 조회된다.
    // AS 별칭이 DepartmentSummary 의 메서드 이름과 짝을 이룬다.
    @Query("SELECT d.id AS id, d.name AS name, d.code AS code, COUNT(s) AS studentCount "
            + "FROM Department d LEFT JOIN d.students s "
            + "GROUP BY d.id, d.name, d.code ORDER BY d.id")
    List<DepartmentSummary> findAllSummaries();

    // 학과의 PK로 조회
    // 학생의 studentDetail 까지 함께 가져온다.
    // Student.studentDetail 은 mappedBy 쪽 @OneToOne 이라 LAZY 가 동작하지 않고,
    // 학생 수만큼 상세정보 조회 쿼리가 추가로 발생하므로 여기서 함께 조회한다.
    @Query("SELECT d FROM Department d "
            + "LEFT JOIN FETCH d.students s "
            + "LEFT JOIN FETCH s.studentDetail "
            + "WHERE d.id = :id")
    Optional<Department> findByIdWithStudents(@Param("id") Long id);

    // 학과코드로 조회할 때에도 소속 학생을 함께 가져온다 ( 지연로딩 추가 조회를 없앤다 )
    @Query("SELECT d FROM Department d "
            + "LEFT JOIN FETCH d.students s "
            + "LEFT JOIN FETCH s.studentDetail "
            + "WHERE d.code = :code")
    Optional<Department> findByCodeWithStudents(@Param("code") String code);
    
    boolean existsByCode(String code);
    
    boolean existsByName(String name);
}