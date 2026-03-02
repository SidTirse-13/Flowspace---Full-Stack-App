package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.ProjectChatDTO;
import com.projectmanagertool.pm_backend.exception.ProjectNotFoundException;
import com.projectmanagertool.pm_backend.exception.UnauthorizedException;
import com.projectmanagertool.pm_backend.model.Project;
import com.projectmanagertool.pm_backend.model.ProjectChat;
import com.projectmanagertool.pm_backend.repository.ProjectChatRepository;
import com.projectmanagertool.pm_backend.repository.ProjectMemberRepository;
import com.projectmanagertool.pm_backend.repository.ProjectRepository;
import com.projectmanagertool.pm_backend.repository.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ProjectChatService {

    private final ProjectChatRepository chatRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");

    public ProjectChatService(ProjectChatRepository chatRepository,
                              ProjectRepository projectRepository,
                              ProjectMemberRepository memberRepository,
                              UserRepository userRepository,
                              @Lazy NotificationService notificationService,
                              @Lazy EmailService emailService) {
        this.chatRepository      = chatRepository;
        this.projectRepository   = projectRepository;
        this.memberRepository    = memberRepository;
        this.userRepository      = userRepository;
        this.notificationService = notificationService;
        this.emailService        = emailService;
    }

    public List<ProjectChatDTO> getMessages(Long projectId, String username) {
        assertMember(projectId, username);
        return chatRepository.findByProjectIdOrderBySentAtAsc(projectId)
                .stream().map(this::toDTO).toList();
    }

    public ProjectChatDTO sendMessage(Long projectId, String message, String username) {
        assertMember(projectId, username);

        if (message == null || message.isBlank())
            throw new RuntimeException("Message cannot be empty");
        if (message.length() > 2000)
            throw new RuntimeException("Message too long (max 2000 characters)");

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        ProjectChat chat = new ProjectChat();
        chat.setProject(project);
        chat.setSenderUsername(username);
        chat.setMessage(message.trim());

        ProjectChatDTO saved = toDTO(chatRepository.save(chat));

        // Detect @mentions and notify
        List<String> mentioned = extractMentions(message);
        for (String mentionedUser : mentioned) {
            if (mentionedUser.equals(username)) continue;
            if (userRepository.findByUsername(mentionedUser).isEmpty()) continue;

            // In-app notification
            notificationService.create(mentionedUser, "CHAT_MENTION",
                    username + " mentioned you in " + project.getName() + ": \"" +
                            truncate(message, 80) + "\"", projectId, null);

            // Email notification
            userRepository.findByUsername(mentionedUser).ifPresent(u -> {
                if (u.getEmail() != null)
                    emailService.sendMentionNotification(
                            u.getEmail(), u.getUsername(),
                            username, project.getName(),
                            truncate(message, 100));
            });
        }

        return saved;
    }

    public void deleteMessage(Long projectId, Long messageId, String username) {
        ProjectChat chat = chatRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        boolean isOwner  = project.getOwnerUsername().equals(username);
        boolean isSender = chat.getSenderUsername().equals(username);
        if (!isOwner && !isSender)
            throw new UnauthorizedException("Cannot delete this message");

        chatRepository.delete(chat);
    }

    // ── Helpers ───────────────────────────────────────────────────

    private List<String> extractMentions(String message) {
        List<String> mentions = new ArrayList<>();
        Matcher m = MENTION_PATTERN.matcher(message);
        while (m.find()) mentions.add(m.group(1));
        return mentions;
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    private void assertMember(Long projectId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
        boolean isOwner  = project.getOwnerUsername().equals(username);
        boolean isMember = memberRepository.existsByProjectIdAndUsername(projectId, username);
        if (!isOwner && !isMember)
            throw new UnauthorizedException("Not a project member");
    }

    private ProjectChatDTO toDTO(ProjectChat c) {
        ProjectChatDTO dto = new ProjectChatDTO();
        dto.setId(c.getId());
        dto.setProjectId(c.getProject().getId());
        dto.setSenderUsername(c.getSenderUsername());
        dto.setMessage(c.getMessage());
        dto.setSentAt(c.getSentAt());
        return dto;
    }
}