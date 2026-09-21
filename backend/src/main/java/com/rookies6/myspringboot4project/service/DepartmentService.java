package com.rookies6.myspringboot4project.service;

import com.rookies6.myspringboot4project.controller.dto.DepartmentDTO;
import com.rookies6.myspringboot4project.entity.Department;
import com.rookies6.myspringboot4project.exception.BusinessException;
import com.rookies6.myspringboot4project.exception.ErrorCode;
import com.rookies6.myspringboot4project.repository.DepartmentRepository;
import com.rookies6.myspringboot4project.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final StudentRepository studentRepository;

    /*
     * [ findAll() 을 쓰지 않는 이유 ]
     *
     *   return departmentRepository.findAll().stream()
     *           .map(d -> SimpleResponse.fromEntity(d, (long) d.getStudents().size()))
     *           .toList();
     *
     * 위와 같이 작성하면 학생 수를 세기 위해 학생 엔티티를 전부 로딩해야 한다.
     * 게다가 Student.studentDetail 은 mappedBy 쪽 @OneToOne 이라 LAZY 가 동작하지 않고
     * default_batch_fetch_size 도 적용되지 않아 학생 수만큼 상세정보 조회가 추가된다.
     *
     *   학과 4개 / 학생 8명 기준 실제 측정
     *     findAll() 방식        : SQL 10번 ( 학과1 + 학생1 + 상세정보8 ), 20행 로딩
     *     findAllSummaries() 방식 : SQL  1번, 4행 로딩
     *
     * 응답에 필요한 것은 id, name, code, studentCount 네 개뿐이므로
     * COUNT 결과만 조회하는 프로젝션을 사용한다.
     */
    // 모든 학과 조회 - 학과 정보와 학생 수를 한 번의 쿼리로 함께 가져온다
    public List<DepartmentDTO.SimpleResponse> getAllDepartments() {
        return departmentRepository.findAllSummaries()
                .stream()
                .map(DepartmentDTO.SimpleResponse::fromSummary)
                .toList();
    }


    public DepartmentDTO.Response getDepartmentById(Long id) {
        Department department = departmentRepository.findByIdWithStudents(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Department", "id", id));
        return DepartmentDTO.Response.fromEntity(department);
    }

    public DepartmentDTO.Response getDepartmentByCode(String code) {
        Department department = departmentRepository.findByCodeWithStudents(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Department", "code", code));
        return DepartmentDTO.Response.fromEntity(department);
    }

    @Transactional
    public DepartmentDTO.Response createDepartment(DepartmentDTO.Request request) {
        // Validate department code is not already in use
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new BusinessException(ErrorCode.DEPARTMENT_CODE_DUPLICATE,
                    request.getCode());
        }

        // Validate department name is not already in use
        if (departmentRepository.existsByName(request.getName())) {
            throw new BusinessException(ErrorCode.DEPARTMENT_NAME_DUPLICATE,
                    request.getName());
        }

        // Create department entity
        Department department = Department.builder()
                .name(request.getName())
                .code(request.getCode())
                .build();

        // Save and return the department
        Department savedDepartment = departmentRepository.save(department);
        return DepartmentDTO.Response.fromEntity(savedDepartment);
    }

    @Transactional
    public DepartmentDTO.Response updateDepartment(Long id, DepartmentDTO.Request request) {
        // Find the department
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Department", "id", id));

        // Check if another department already has the code
        if (!department.getCode().equals(request.getCode()) &&
                departmentRepository.existsByCode(request.getCode())) {
            throw new BusinessException(ErrorCode.DEPARTMENT_CODE_DUPLICATE,
                    request.getCode());
        }

        // Check if another department already has the name
        if (!department.getName().equals(request.getName()) &&
                departmentRepository.existsByName(request.getName())) {
            throw new BusinessException(ErrorCode.DEPARTMENT_NAME_DUPLICATE,
                    request.getName());
        }

        // Update department info
        department.setName(request.getName());
        department.setCode(request.getCode());

        // Save and return updated department
        Department updatedDepartment = departmentRepository.save(department);
        return DepartmentDTO.Response.fromEntity(updatedDepartment);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Department", "id", id);
        }

        // Check if department has students
        Long studentCount = studentRepository.countByDepartmentId(id);
        if (studentCount > 0) {
            throw new BusinessException(ErrorCode.DEPARTMENT_HAS_STUDENTS,
                    id, studentCount);
        }

        departmentRepository.deleteById(id);
    }
}