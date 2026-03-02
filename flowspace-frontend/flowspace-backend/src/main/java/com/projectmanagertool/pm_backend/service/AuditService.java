package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.AuditLogDTO;
import com.projectmanagertool.pm_backend.model.AuditLog;
import com.projectmanagertool.pm_backend.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    // ── Core log method ───────────────────────────────────────────
    public void log(String entityType, Long entityId, String action,
                    String description, String performedBy) {
        try {
            AuditLog entry = AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .description(description)
                    .performedBy(performedBy)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Never let audit logging break normal flow
            System.err.println("⚠ Audit log failed: " + e.getMessage());
        }
    }

    // ── Convenience helpers ───────────────────────────────────────

    public void logTaskCreate(Long taskId, String title, String username) {
        log("TASK", taskId, "CREATE",
                username + " created task \"" + title + "\"", username);
    }

    public void logTaskDelete(Long taskId, String title, String username) {
        log("TASK", taskId, "DELETE",
                username + " deleted task \"" + title + "\"", username);
    }

    public void logStatusChange(Long taskId, String title,
                                String oldStatus, String newStatus, String username) {
        log("TASK", taskId, "STATUS_CHANGE",
                username + " changed status of \"" + title + "\" from "
                        + oldStatus + " → " + newStatus, username);
    }

    public void logAssign(Long taskId, String title,
                          String assignedTo, String username) {
        log("TASK", taskId, "ASSIGN",
                username + " assigned \"" + title + "\" to " + assignedTo, username);
    }

    public void logTaskEdit(Long taskId, String title, String username) {
        log("TASK", taskId, "UPDATE",
                username + " edited task \"" + title + "\"", username);
    }

    public void logComment(Long taskId, String title, String username) {
        log("TASK", taskId, "COMMENT",
                username + " commented on \"" + title + "\"", username);
    }

    public void logProjectCreate(Long projectId, String name, String username) {
        log("PROJECT", projectId, "CREATE",
                username + " created project \"" + name + "\"", username);
    }

    public void logProjectEdit(Long projectId, String name, String username) {
        log("PROJECT", projectId, "UPDATE",
                username + " edited project \"" + name + "\"", username);
    }

    public void logProjectDelete(Long projectId, String name, String username) {
        log("PROJECT", projectId, "DELETE",
                username + " deleted project \"" + name + "\"", username);
    }

    // ── Fetch logs ────────────────────────────────────────────────

    public List<AuditLogDTO> getLogsForTask(Long taskId) {
        return auditLogRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("TASK", taskId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<AuditLogDTO> getLogsForProject(Long projectId) {
        return auditLogRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("PROJECT", projectId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<AuditLogDTO> getLogsForUser(String username) {
        return auditLogRepository
                .findByPerformedByOrderByTimestampDesc(username)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Mapper ────────────────────────────────────────────────────
    private AuditLogDTO toDTO(AuditLog a) {
        return AuditLogDTO.builder()
                .id(a.getId())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .action(a.getAction())
                .description(a.getDescription())
                .performedBy(a.getPerformedBy())
                .timestamp(a.getTimestamp())
                .build();
    }
}
