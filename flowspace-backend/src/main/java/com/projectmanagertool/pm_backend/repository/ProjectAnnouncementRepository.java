package com.projectmanagertool.pm_backend.repository;
import com.projectmanagertool.pm_backend.model.ProjectAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectAnnouncementRepository extends JpaRepository<ProjectAnnouncement, Long> {
    List<ProjectAnnouncement> findByProjectIdAndPinnedTrueOrderByCreatedAtDesc(Long projectId);
    List<ProjectAnnouncement> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}
