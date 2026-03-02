package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.ProjectChatDTO;
import com.projectmanagertool.pm_backend.service.ProjectChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/chat")
public class ProjectChatController {

    private final ProjectChatService chatService;

    public ProjectChatController(ProjectChatService chatService) {
        this.chatService = chatService;
    }

    // GET /api/projects/{id}/chat — load all messages
    @GetMapping
    public List<ProjectChatDTO> getMessages(@PathVariable Long projectId,
                                            Authentication auth) {
        return chatService.getMessages(projectId, auth.getName());
    }

    // POST /api/projects/{id}/chat — send a message
    @PostMapping
    public ResponseEntity<ProjectChatDTO> sendMessage(@PathVariable Long projectId,
                                                      @RequestBody Map<String, String> body,
                                                      Authentication auth) {
        String message = body.get("message");
        return ResponseEntity.ok(chatService.sendMessage(projectId, message, auth.getName()));
    }

    // DELETE /api/projects/{id}/chat/{messageId} — delete a message
    @DeleteMapping("/{messageId}")
    public ResponseEntity<String> deleteMessage(@PathVariable Long projectId,
                                                @PathVariable Long messageId,
                                                Authentication auth) {
        chatService.deleteMessage(projectId, messageId, auth.getName());
        return ResponseEntity.ok("Message deleted");
    }
}
