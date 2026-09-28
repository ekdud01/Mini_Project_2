package com.kdsq.result;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SolutionRepository extends JpaRepository<Solution, Long> {
    List<Solution> findByRiskLevel(RiskLevel riskLevel);
}