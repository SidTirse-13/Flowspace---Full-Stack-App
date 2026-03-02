package com.projectmanagertool.pm_backend.repository;

import com.projectmanagertool.pm_backend.model.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Long> {

    // All attachments for a task, newest first
    List<TaskAttachment> findByTaskIdOrderByUploadedAtDesc(Long taskId);

    // Count how many attachments a task has
    long countByTaskId(Long taskId);
}
