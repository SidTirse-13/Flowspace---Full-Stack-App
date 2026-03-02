package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.*;
import com.projectmanagertool.pm_backend.model.Task;
import com.projectmanagertool.pm_backend.model.TaskComment;
import com.projectmanagertool.pm_backend.model.TaskStatus;
import com.projectmanagertool.pm_backend.repository.TaskCommentRepository;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import com.projectmanagertool.pm_backend.service.TaskService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
public class TaskController {

    private final TaskService taskService;
    private final TaskRepository taskRepository;
    private final TaskCommentRepository commentRepository;

    public TaskController(TaskService taskService,
                          TaskRepository taskRepository,
                          TaskCommentRepository commentRepository) {
        this.taskService = taskService;
        this.taskRepository = taskRepository;
        this.commentRepository = commentRepository;
    }

    // ── CREATE TASK ────────────────────────────────────────────────
    @PostMapping
    public Task createTask(@PathVariable Long projectId,
                           @RequestBody TaskRequest request,
                           Authentication authentication) {
        return taskService.createTask(projectId, request, authentication.getName());
    }

    // ── GET TASKS ──────────────────────────────────────────────────
    @GetMapping
    public List<TaskResponse> getTasks(@PathVariable Long projectId, Authentication authentication) {
        return taskService.getProjectTasks(projectId, authentication.getName());
    }

    // ── SEARCH TASKS (Feature 6) ───────────────────────────────────
    @GetMapping("/search")
    public List<TaskResponse> searchTasks(@PathVariable Long projectId,
                                          @RequestParam(required = false) String query,
                                          @RequestParam(required = false) String status,
                                          Authentication authentication) {
        return taskService.searchTasks(projectId, query, status, authentication.getName());
    }

    // ── UPDATE TASK STATUS ─────────────────────────────────────────
    @PutMapping("/{taskId}/status")
    public Task updateStatus(@PathVariable Long projectId,
                             @PathVariable Long taskId,
                             @RequestParam TaskStatus status,
                             Authentication authentication) {
        return taskService.updateTaskStatus(taskId, status, authentication.getName());
    }

    // ── EDIT TASK (Feature 1) ──────────────────────────────────────
    @PutMapping("/{taskId}")
    public TaskResponse editTask(@PathVariable Long projectId,
                                 @PathVariable Long taskId,
                                 @RequestBody TaskRequest request,
                                 Authentication authentication) {
        return taskService.editTask(taskId, request, authentication.getName());
    }

    // ── ASSIGN TASK ────────────────────────────────────────────────
    @PutMapping("/{taskId}/assign")
    public String assignTask(@PathVariable Long projectId,
                             @PathVariable Long taskId,
                             @RequestBody AssignTaskRequest request,
                             Authentication authentication) {
        taskService.assignTask(taskId, request.getUsername(), authentication.getName());
        return "Task assigned successfully";
    }

    // ── DELETE TASK ────────────────────────────────────────────────
    @DeleteMapping("/{taskId}")
    public String deleteTask(@PathVariable Long projectId,
                             @PathVariable Long taskId,
                             Authentication authentication) {
        taskService.deleteTask(taskId, authentication.getName());
        return "Task deleted successfully";
    }

    // ── GET COMMENTS (Feature 4) ───────────────────────────────────
    @GetMapping("/{taskId}/comments")
    public List<CommentDTO> getComments(@PathVariable Long taskId) {
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(c -> CommentDTO.builder()
                        .id(c.getId())
                        .content(c.getContent())
                        .authorUsername(c.getAuthorUsername())
                        .createdAt(c.getCreatedAt())
                        .build())
                .toList();
    }

    // ── ADD COMMENT (Feature 4) ────────────────────────────────────
    @PostMapping("/{taskId}/comments")
    public CommentDTO addComment(@PathVariable Long taskId,
                                 @RequestBody Map<String, String> body,
                                 Authentication authentication) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        String content  = body.get("content");
        String username = authentication.getName();

        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Comment content cannot be empty");
        }

        boolean isOwner    = task.getProject().getOwnerUsername().equals(username);
        boolean isAssignee = username.equals(task.getAssignedTo());
        if (!isOwner && !isAssignee) {
            throw new RuntimeException("Only the project owner or assigned user can comment");
        }

        TaskComment comment = new TaskComment();
        comment.setContent(content.trim());
        comment.setAuthorUsername(username);
        comment.setTask(task);
        TaskComment saved = commentRepository.save(comment);

        return CommentDTO.builder()
                .id(saved.getId())
                .content(saved.getContent())
                .authorUsername(saved.getAuthorUsername())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    // ── DELETE COMMENT (Feature 4) ─────────────────────────────────
    @DeleteMapping("/{taskId}/comments/{commentId}")
    public String deleteComment(@PathVariable Long commentId,
                                Authentication authentication) {
        TaskComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!comment.getAuthorUsername().equals(authentication.getName())) {
            throw new RuntimeException("You can only delete your own comments");
        }
        commentRepository.delete(comment);
        return "Comment deleted";
    }
}