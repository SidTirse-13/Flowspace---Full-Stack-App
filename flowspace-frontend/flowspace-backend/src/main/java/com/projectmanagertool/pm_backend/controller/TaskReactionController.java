package com.projectmanagertool.pm_backend.controller;
import com.projectmanagertool.pm_backend.dto.TaskReactionDTO;
import com.projectmanagertool.pm_backend.service.TaskReactionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks/{taskId}/reactions")
public class TaskReactionController {
    private final TaskReactionService service;
    public TaskReactionController(TaskReactionService service) { this.service = service; }

    @GetMapping
    public TaskReactionDTO get(@PathVariable Long taskId, Authentication auth) {
        return service.getReactions(taskId, auth.getName());
    }

    @PostMapping("/{emoji}")
    public TaskReactionDTO toggle(@PathVariable Long taskId,
                                  @PathVariable String emoji, Authentication auth) {
        return service.toggle(taskId, emoji, auth.getName());
    }
}
