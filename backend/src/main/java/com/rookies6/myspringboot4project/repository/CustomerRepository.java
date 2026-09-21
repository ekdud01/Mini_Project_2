package com.rookies6.myspringboot4project.repository;

import com.rookies6.myspringboot4project.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    // finder(query) method
    // 1. customerId(고객번호, Unique이므로 중복 허용 안 함)로 조회하는 finder 메서드
    Optional<Customer> findByCustomerId(String customerId);

    // 2. customerName(고객명, 중복 허용함)로 조회하는 finder 메서드 % name %
    List<Customer> findByCustomerNameContains(String customenName);

}
