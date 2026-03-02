package com.projectmanagertool.pm_backend.repository;

import com.projectmanagertool.pm_backend.model.ProjectChat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectChatRepository extends JpaRepository<ProjectChat, Long> {
    List<ProjectChat> findByProjectIdOrderBySentAtAsc(Long projectId);
}
