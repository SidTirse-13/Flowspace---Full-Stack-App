package com.projectmanagertool.pm_backend.repository;

import com.projectmanagertool.pm_backend.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProjectId(Long projectId);
    List<ProjectMember> findByUsername(String username);
    Optional<ProjectMember> findByProjectIdAndUsername(Long projectId, String username);
    boolean existsByProjectIdAndUsername(Long projectId, String username);
    void deleteByProjectIdAndUsername(Long projectId, String username);
}
