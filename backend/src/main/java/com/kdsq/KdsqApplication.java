package com.kdsq;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class KdsqApplication {

    public static void main(String[] args) {
        // 서버 시간대를 한국 시간으로 고정 (Entity 설계서 14.2)
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
        SpringApplication.run(KdsqApplication.class, args);
    }
}
