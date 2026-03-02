package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.*;
import com.projectmanagertool.pm_backend.model.Project;
import com.projectmanagertool.pm_backend.service.ProjectService;
import com.projectmanagertool.pm_backend.service.TaskService;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final TaskService    taskService;

    public ProjectController(ProjectService projectService, TaskService taskService) {
        this.projectService = projectService;
        this.taskService    = taskService;
    }

    // ── CREATE PROJECT ─────────────────────────────────────────────
    // FIX (Bug #06): Now returns ProjectResponse DTO instead of raw Project entity.
    @PostMapping
    public ProjectResponse create(@RequestBody Project project, Authentication authentication) {
        return projectService.create(project, authentication.getName());
    }

    // ── GET PROJECTS (paginated) ───────────────────────────────────
    // FIX (Bug #06): Returns Page<ProjectResponse> instead of Page<Project>.
    @GetMapping
    public Page<ProjectResponse> getProjects(Authentication authentication,
                                             @RequestParam(defaultValue = "0")       int    page,
                                             @RequestParam(defaultValue = "5")       int    size,
                                             @RequestParam(defaultValue = "id,desc") String sort) {
        return projectService.getUserProjects(authentication.getName(), page, size, sort);
    }

    // ── DELETE PROJECT ─────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id, Authentication authentication) {
        projectService.delete(id, authentication.getName());
        return "Project deleted successfully";
    }

    // ── EDIT PROJECT (Feature 2) ───────────────────────────────────
    @PutMapping("/{id}")
    public ProjectResponse editProject(@PathVariable Long id,
                                       @RequestBody ProjectRequest request,
                                       Authentication authentication) {
        return projectService.editProject(id, request, authentication.getName());
    }

    // ── SEARCH PROJECTS (Feature 6) ────────────────────────────────
    @GetMapping("/search")
    public List<ProjectResponse> searchProjects(@RequestParam(required = false) String query,
                                                Authentication authentication) {
        return projectService.searchProjects(query, authentication.getName());
    }

    // ── GANTT DATA ─────────────────────────────────────────────────
    @GetMapping("/{projectId}/gantt")
    public List<GanttTaskDTO> getGanttData(@PathVariable Long projectId, Authentication authentication) {
        return taskService.getGanttData(projectId, authentication.getName());
    }

    // ── CRITICAL PATH ──────────────────────────────────────────────
    @GetMapping("/{projectId}/critical-path")
    public CriticalPathDTO getCriticalPath(@PathVariable Long projectId, Authentication authentication) {
        return taskService.calculateCriticalPath(projectId, authentication.getName());
    }

    // ── ANALYTICS ──────────────────────────────────────────────────
    @GetMapping("/{projectId}/analytics")
    public ProjectAnalyticsDTO getAnalytics(@PathVariable Long projectId, Authentication authentication) {
        return taskService.getProjectAnalytics(projectId, authentication.getName());
    }

    // ── SLACK DAYS ─────────────────────────────────────────────────
    @GetMapping("/{projectId}/slack")
    public List<TaskSlackDTO> getSlack(@PathVariable Long projectId, Authentication authentication) {
        return taskService.calculateSlack(projectId, authentication.getName());
    }

    // ── WORKLOAD PER USER (Feature 8) ──────────────────────────────
    @GetMapping("/{projectId}/workload")
    public List<WorkloadDTO> getWorkload(@PathVariable Long projectId, Authentication authentication) {
        return taskService.getWorkload(projectId, authentication.getName());
    }
}
