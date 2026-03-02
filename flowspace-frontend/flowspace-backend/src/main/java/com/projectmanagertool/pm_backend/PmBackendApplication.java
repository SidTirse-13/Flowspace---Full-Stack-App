package com.projectmanagertool.pm_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing        // needed for @CreatedDate on TaskComment, TaskAttachment
@EnableScheduling         // ← NEW: enables @Scheduled cron jobs
public class PmBackendApplication {
	public static void main(String[] args) {
		SpringApplication.run(PmBackendApplication.class, args);

		System.out.println("-------- App Started --------");
	}


}