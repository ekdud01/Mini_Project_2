package com.rookies6.myspringboot4project.runner;

import com.rookies6.myspringboot4project.config.CustomVO;
import com.rookies6.myspringboot4project.property.MyBootProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

@Component
public class MyRunner implements ApplicationRunner {
    @Value("${spring.application.name}")
    String applicationName;

    @Value("${myboot.name}")
    private String name;

    @Value("${myboot.age}")
    private int age;

    @Autowired
    private Environment environment;

    @Autowired
    private MyBootProperties properties;

    @Autowired
    private CustomVO customVO;

    private Logger logger = LoggerFactory.getLogger(MyRunner.class);


    @Override
    public void run(ApplicationArguments args) throws Exception {
        logger.info("Logger 구현체 클래스명 {}", logger.getClass().getName());
        logger.debug("MyRunner run() 호출됨!!");
        logger.debug("Application Name = {}", applicationName);

        // Consumer 인터페이스를 Anonymous Inner Class로 표현.
        args.getOptionNames().forEach(new Consumer<String>() {
            @Override
            public void accept(String s) {
                System.out.println("arg name = " + s);
            }
        });

        // args.getOptionNames() 메서드의 return 타입 Set<String>
        // Iterable의 forEach(Consumer)
        // Consumer의 추상 메서드 void accept(T t)
        // Consumer 인터페이스를 람다식으로 표현.
        args.getOptionNames().forEach(name -> System.out.println("Name = " + name));

        // Consumer 인터페이스를 Method Reference로 표현.
        args.getOptionNames().forEach(System.out::println);

        logger.debug("${myboot.name} = {}", name);
        logger.debug("${myboot.age} = {}", age);
        logger.debug("${myboot.fullName} = {}", environment.getProperty("myboot.fullName"));

        logger.info("MyBootProperties getName = {}", properties.getName());
        logger.info("MyBootProperties getAge = {}", properties.getAge());
        logger.info("MyBootProperties getFullName = {}", properties.getFullName());

        logger.debug("현재 활성화된 CustomVO = {}", customVO);

    }
}
