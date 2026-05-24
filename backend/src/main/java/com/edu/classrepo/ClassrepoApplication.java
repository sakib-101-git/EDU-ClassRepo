package com.edu.classrepo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ClassrepoApplication {
    public static void main(String[] args) {
        SpringApplication.run(ClassrepoApplication.class, args);
    }
}
