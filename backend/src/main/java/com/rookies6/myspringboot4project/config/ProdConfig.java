package com.rookies6.myspringboot4project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("prod")
public class ProdConfig {
    @Bean
    public CustomVO customVO() {
        return CustomVO.builder()
                .mode("운영 환경")
                .rate(1.5)
                .build();
    }
}
