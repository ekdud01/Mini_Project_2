package com.rookies6.myspringboot4project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("test")
public class TestConfig {
    @Bean
    public CustomVO customVO() {
        return CustomVO.builder() //CustomVOBuilder
                .mode("테스트 환경")
                .rate(0.5)
                .build();
    }
}