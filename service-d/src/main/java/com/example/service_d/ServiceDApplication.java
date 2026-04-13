package com.example.service_d;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class ServiceDApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServiceDApplication.class, args);
    }
}