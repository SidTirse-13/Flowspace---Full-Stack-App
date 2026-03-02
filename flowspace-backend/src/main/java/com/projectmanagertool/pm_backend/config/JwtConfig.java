package com.projectmanagertool.pm_backend.config;

import com.projectmanagertool.pm_backend.repository.UserRepository;
import com.projectmanagertool.pm_backend.security.JwtAuthFilter;
import com.projectmanagertool.pm_backend.security.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {

    @Bean
    public JwtAuthFilter jwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        return new JwtAuthFilter(jwtService, userRepository);
    }
}
