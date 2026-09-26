package com.kdsq.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import nz.net.ultraq.thymeleaf.layoutdialect.LayoutDialect;

/**
 * Thymeleaf Layout Dialect 등록 — layout:decorate / layout:fragment 사용 (UI 설계서 2.5)
 */
@Configuration
public class ThymeleafConfig {

    @Bean
    public LayoutDialect layoutDialect() {
        return new LayoutDialect();
    }
}
