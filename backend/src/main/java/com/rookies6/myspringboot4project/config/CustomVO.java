package com.rookies6.myspringboot4project.config;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Builder
@Getter
@ToString
public class CustomVO {
    private String mode;
    private double rate;
}