package com.rookies6.myspringboot4project;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

public class StreamTest {
    @Test
    void stream() {
        List<String> names = List.of("Alice", "Bob", "Charlie", "Diana");

        // (1) for 문 방식 : 이름 길이가 3 초과인 것만 골라 대문자로 바꾸기
        List<String> result1 = new ArrayList<>();
        for (String name : names) {
            if (name.length() > 3) {
                result1.add(name.toUpperCase());
            }
        }
        // 결과 : [ALICE, CHARLIE, DIANA]
        System.out.println(result1);

        // (2) Stream 방식 : (1)과 완전히 같은 동작
        List<String> result2 = names.stream()      	// ① 스트림 생성 : List<String> => Stream<String>
                // .filter(Predicate) Predicate 추상 메서드 T -> boolean
                .filter(name -> name.length() > 3) 	// ② 중간 연산 - 길이가 3 초과인 것만
                // .map(FUnction) Function 추상 메서드  T -> R
                //.map(name -> name.toUpperCase())
                .map(String::toUpperCase)          	// ② 중간 연산 - 대문자로 변환
                .toList();                         	// ③ 최종 연산 - List 로 수집 : Stream<String> => List<String>
        // 결과 : [ALICE, CHARLIE, DIANA]
        System.out.println(result2);
    }
}
