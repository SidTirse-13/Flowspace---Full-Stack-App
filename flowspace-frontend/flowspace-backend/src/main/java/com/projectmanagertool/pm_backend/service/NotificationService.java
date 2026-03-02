package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.NotificationDTO;
import com.projectmanagertool.pm_backend.model.Notification;
import com.projectmanagertool.pm_backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) {
        this.repo = repo;
    }

    // ── CREATE ─────────────────────────────────────────────────────
    public void create(String recipient, String type, String message,
                       Long projectId, Long taskId) {
        if (recipient == null || recipient.isBlank()) return;
        Notification n = new Notification();
        n.setRecipientUsername(recipient);
        n.setType(type);
        n.setMessage(message);
        n.setProjectId(projectId);
        n.setTaskId(taskId);
        repo.save(n);
    }

    // ── GET ALL FOR USER ───────────────────────────────────────────
    public List<NotificationDTO> getForUser(String username) {
        return repo.findByRecipientUsernameOrderByCreatedAtDesc(username)
                .stream().map(this::toDTO).toList();
    }

    // ── UNREAD COUNT ───────────────────────────────────────────────
    public long getUnreadCount(String username) {
        return repo.countByRecipientUsernameAndReadFalse(username);
    }

    // ── MARK ALL READ ──────────────────────────────────────────────
    @Transactional
    public void markAllRead(String username) {
        repo.markAllReadForUser(username);
    }

    // ── MARK ONE READ ──────────────────────────────────────────────
    @Transactional
    public void markRead(Long id, String username) {
        repo.findById(id).ifPresent(n -> {
            if (n.getRecipientUsername().equals(username)) {
                n.setRead(true);
                repo.save(n);
            }
        });
    }

    // ── DELETE ALL FOR USER ────────────────────────────────────────
    @Transactional
    public void deleteAll(String username) {
        repo.findByRecipientUsernameOrderByCreatedAtDesc(username)
                .forEach(repo::delete);
    }

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .type(n.getType())
                .message(n.getMessage())
                .projectId(n.getProjectId())
                .taskId(n.getTaskId())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
