package com.rookies6.myspringboot4project.repository;

import com.rookies6.myspringboot4project.entity.Customer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
//@Transactional
class CustomerRepositoryTest {
    @Autowired
    CustomerRepository customerRepository;

    // 1. Customer 등록
    @Test
    @Rollback(value = false) // 등록된 데이터를 확인하려고 하니 Rollback 처리를 하지 마세요.
    void testCreate() {
        // Given(준비 단계)
        Customer customer = new Customer();
        customer.setCustomerId("D002");
        customer.setCustomerName("길동3");

        // When(실행 단계)
        Customer addCustomer = customerRepository.save(customer);

        // Then(검증 단계)
        assertThat(addCustomer).isNotNull();
        assertThat(addCustomer.getCustomerName()).isEqualTo("길동3");
    }

    // 2. Customer 조회
    @Test
    void testFindBy() {
        Optional<Customer> optionalCustomer = customerRepository.findById(1L);
        if (optionalCustomer.isPresent()) {
            Customer existCustomer = optionalCustomer.get();
            assertThat(existCustomer.getId()).isEqualTo(1L);
        }
        // ifPresent(Consumer) Consumer의 추상 메서드 void accept(T t)
        optionalCustomer.ifPresent(customer -> System.out.println(customer.getCustomerName()));
    }

    @Test
    void testFindByNotFound() {
        // Optional의 orElseGet(Supplier) Supplier의 추상 메서드 T get()  () -> T
        Customer notFoundCustomer = customerRepository.findByCustomerId("B001") // Optional<Customer>
                .orElseGet(() -> new Customer());
        //assertThat(notFoundCustomer.getCustomerId()).isEqualTo("A004");
        assertThat(notFoundCustomer.getCustomerId()).isNull();

        // orElseThrow(Supplier) X get()  () -> X  ==> X extends Throwable
        // public <X extends Throwable> T orElseThrow(Supplier<? extends X> exceptionSupplier)
        Customer notFound = customerRepository.findById(3L)
                .orElseThrow(() -> new RuntimeException("Customer Not Found"));
    }

    @Test
    //@Rollback(value = false)
    void testUpdate() {
        Customer customer = customerRepository.findByCustomerId("A004")
                .orElseGet(() -> new Customer());
        // Setter 호출 EntityManager가 Dirty Checking을 함.
        customer.setCustomerName("박둘리2");
        Customer updatedCustomer = customerRepository.save(customer);
        assertThat(updatedCustomer.getCustomerName()).isEqualTo("박둘리2");
    }
}