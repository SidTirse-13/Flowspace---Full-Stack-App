package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.NotificationDTO;
import com.projectmanagertool.pm_backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // GET /api/notifications — all notifications for current user
    @GetMapping
    public List<NotificationDTO> getAll(Authentication auth) {
        return notificationService.getForUser(auth.getName());
    }

    // GET /api/notifications/unread-count
    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(Authentication auth) {
        return Map.of("count", notificationService.getUnreadCount(auth.getName()));
    }

    // PUT /api/notifications/read-all
    @PutMapping("/read-all")
    public ResponseEntity<String> markAllRead(Authentication auth) {
        notificationService.markAllRead(auth.getName());
        return ResponseEntity.ok("All marked as read");
    }

    // PUT /api/notifications/{id}/read
    @PutMapping("/{id}/read")
    public ResponseEntity<String> markRead(@PathVariable Long id, Authentication auth) {
        notificationService.markRead(id, auth.getName());
        return ResponseEntity.ok("Marked as read");
    }

    // DELETE /api/notifications — clear all
    @DeleteMapping
    public ResponseEntity<String> deleteAll(Authentication auth) {
        notificationService.deleteAll(auth.getName());
        return ResponseEntity.ok("Cleared");
    }
}
