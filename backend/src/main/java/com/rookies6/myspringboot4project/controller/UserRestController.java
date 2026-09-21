package com.rookies6.myspringboot4project.controller;

import com.rookies6.myspringboot4project.entity.User;
import com.rookies6.myspringboot4project.exception.BusinessException;
import com.rookies6.myspringboot4project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@Slf4j
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserRestController {
    private final UserRepository userRepository;

    // Constructor Injection - Mock 객체 주입이 가능.
//    public UserRestController(UserRepository userRepository) {
//        log.info("UserRepository 구현 클래스명 = {}", userRepository.getClass().getName());
//        this.userRepository = userRepository;
//    }

    @PostMapping
    public User createUser(@RequestBody User userDetail) {
        return userRepository.save(userDetail);
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        Optional<User> optionalUser = userRepository.findById(id); // Optional<User>
        // orElseThrow(Supplier) Supplier의 추상 메서드 () -> T
        User existUser = getUser(optionalUser);
        return existUser;
    }

    private static User getUser(Optional<User> optionalUser) {
        User existUser = optionalUser.orElseThrow(
                () -> new BusinessException("User Not Found", HttpStatus.NOT_FOUND));
        return existUser;
    }

    @GetMapping
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{email}/")
    public User getUserByEmail(@PathVariable String email) {
        User existUser = getUser(userRepository.findByEmail(email));
        return existUser;
    }

    @PatchMapping("/{email}/")
    public User updateUser(@PathVariable String email, @RequestBody User userDetail) {
        User existUser = getUser(userRepository.findByEmail(email));
        // Setter Method 호출
        existUser.setName(userDetail.getName());
        // save()를 호출해야 updateQuery가 처리됨.
        return userRepository.save(existUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User existUser = getUser(userRepository.findById(id));
        userRepository.delete(existUser);
        return ResponseEntity.ok("Id = " + id + " User가 삭제 되었습니다.");
    }

}
