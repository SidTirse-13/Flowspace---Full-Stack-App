package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.ProjectRequest;
import com.projectmanagertool.pm_backend.dto.ProjectResponse;
import com.projectmanagertool.pm_backend.exception.ProjectNotFoundException;
import com.projectmanagertool.pm_backend.exception.UnauthorizedException;
import com.projectmanagertool.pm_backend.model.Project;
import com.projectmanagertool.pm_backend.model.TaskStatus;
import com.projectmanagertool.pm_backend.repository.ProjectRepository;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskRepository    taskRepository;
    private final AuditService      auditService;

    public ProjectService(ProjectRepository projectRepository,
                          TaskRepository taskRepository,
                          AuditService auditService) {
        this.projectRepository = projectRepository;
        this.taskRepository    = taskRepository;
        this.auditService      = auditService;
    }

    // ── CREATE ────────────────────────────────────────────────────
    public ProjectResponse create(Project project, String username) {
        project.setOwnerUsername(username);
        Project saved = projectRepository.save(project);
        auditService.logProjectCreate(saved.getId(), saved.getName(), username);
        return toDTO(saved);
    }

    // ── GET PROJECTS (paginated) ──────────────────────────────────
    public Page<ProjectResponse> getUserProjects(String username, int page, int size, String sort) {
        String[] sortParts = sort.split(",");
        String sortField   = sortParts[0];
        String direction   = sortParts.length > 1 ? sortParts[1] : "asc";
        Sort sorting       = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortField).descending()
                : Sort.by(sortField).ascending();
        Page<Project> raw  = projectRepository.findByOwnerUsername(username, PageRequest.of(page, size, sorting));
        return raw.map(this::toDTO);
    }

    // ── DELETE ────────────────────────────────────────────────────
    public void delete(Long id, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
        if (!project.getOwnerUsername().equals(username))
            throw new UnauthorizedException("Unauthorized");
        String name = project.getName();
        projectRepository.delete(project);
        auditService.logProjectDelete(id, name, username);
    }

    // ── EDIT ──────────────────────────────────────────────────────
    public ProjectResponse editProject(Long id, ProjectRequest request, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
        if (!project.getOwnerUsername().equals(username))
            throw new UnauthorizedException("Only the project owner can edit this project");
        if (request.getName() != null && !request.getName().isBlank())
            project.setName(request.getName());
        if (request.getDescription() != null)
            project.setDescription(request.getDescription());
        if (request.getStartDate() != null)
            project.setStartDate(request.getStartDate());
        if (request.getEndDate() != null)
            project.setEndDate(request.getEndDate());
        if (request.getColor() != null)
            project.setColor(request.getColor());
        Project saved = projectRepository.save(project);
        auditService.logProjectEdit(saved.getId(), saved.getName(), username);
        return toDTO(saved);
    }

    // ── SEARCH ────────────────────────────────────────────────────
    public List<ProjectResponse> searchProjects(String query, String username) {
        String q = (query == null) ? "" : query;
        return projectRepository.findByOwnerUsernameAndNameContainingIgnoreCase(username, q)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── DTO mapper — includes live task counts ────────────────────
    public ProjectResponse toDTO(Project p) {
        int total      = (int) taskRepository.countByProjectId(p.getId());
        int done       = (int) taskRepository.countByProjectIdAndStatus(p.getId(), TaskStatus.DONE);
        int inProgress = (int) taskRepository.countByProjectIdAndStatus(p.getId(), TaskStatus.IN_PROGRESS);
        int todo       = (int) taskRepository.countByProjectIdAndStatus(p.getId(), TaskStatus.TODO);
        int pct        = total == 0 ? 0 : (int) ((done * 100L) / total);

        return ProjectResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .ownerUsername(p.getOwnerUsername())
                .color(p.getColor())
                .totalTasks(total)
                .doneTasks(done)
                .inProgressTasks(inProgress)
                .todoTasks(todo)
                .completionPercent(pct)
                .build();
    }
}