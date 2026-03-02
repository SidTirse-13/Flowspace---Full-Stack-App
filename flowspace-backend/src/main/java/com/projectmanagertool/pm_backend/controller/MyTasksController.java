package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.MyTaskDTO;
import com.projectmanagertool.pm_backend.service.TaskService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Separate controller for /api/tasks/* routes that don't belong to a specific project.
 * TaskController handles /api/projects/{projectId}/tasks/*
 * This handles /api/tasks/*
 */
@RestController
@RequestMapping("/api/tasks")
public class MyTasksController {

    private final TaskService taskService;

    public MyTasksController(TaskService taskService) {
        this.taskService = taskService;
    }

    // GET /api/tasks/my-tasks
    // Returns all tasks assigned to the currently logged-in user across ALL projects
    @GetMapping("/my-tasks")
    public List<MyTaskDTO> getMyTasks(Authentication authentication) {
        return taskService.getMyTasks(authentication.getName());
    }
}