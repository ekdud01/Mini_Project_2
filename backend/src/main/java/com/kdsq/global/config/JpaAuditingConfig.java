package com.kdsq.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * BaseEntity의 created_at / updated_at 자동 기록 (Entity 설계서 7.2)
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
