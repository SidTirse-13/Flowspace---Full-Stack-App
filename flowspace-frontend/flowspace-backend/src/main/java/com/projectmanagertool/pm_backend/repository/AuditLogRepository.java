package com.projectmanagertool.pm_backend.repository;

import com.projectmanagertool.pm_backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // All logs for a specific task or project (e.g. entityType="TASK", entityId=5)
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(
            String entityType, Long entityId);

    // All actions performed by a user
    List<AuditLog> findByPerformedByOrderByTimestampDesc(String performedBy);
}
