package com.projectmanagertool.pm_backend.repository;

import com.projectmanagertool.pm_backend.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByOwnerUsername(String ownerUsername, Pageable pageable);
    List<Project> findByOwnerUsernameAndNameContainingIgnoreCase(String owner, String name);
    List<Project> findByOwnerUsername(String ownerUsername);
}
