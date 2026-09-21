package com.rookies6.myspringboot4project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MySpringBoot4ProjectApplication {

	public static void main(String[] args) {
        //SpringApplication.run(MySpringBoot4ProjectApplication.class, args);
        SpringApplication application = new SpringApplication(MySpringBoot4ProjectApplication.class);

        // Application type 변경
        // 자동으로 AnnotationConfigServletWebServerApplicationContext 컨테이너 객체가 생성됨.
        application.setWebApplicationType(WebApplicationType.SERVLET);
        application.run(args);
    }

    @Bean
    public String myBean() {
        return "Hello";
    }


}
