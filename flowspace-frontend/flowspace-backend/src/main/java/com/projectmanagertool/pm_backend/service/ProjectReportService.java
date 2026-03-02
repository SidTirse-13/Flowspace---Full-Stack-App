package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.ProjectReportDTO;
import com.projectmanagertool.pm_backend.model.Project;
import com.projectmanagertool.pm_backend.model.Task;
import com.projectmanagertool.pm_backend.repository.ProjectRepository;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import com.projectmanagertool.pm_backend.repository.TimeLogRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectReportService {

    private final ProjectRepository projectRepo;
    private final TaskRepository    taskRepo;
    private final TimeLogRepository timeLogRepo;

    public ProjectReportService(ProjectRepository projectRepo,
                                TaskRepository taskRepo,
                                TimeLogRepository timeLogRepo) {
        this.projectRepo  = projectRepo;
        this.taskRepo     = taskRepo;
        this.timeLogRepo  = timeLogRepo;
    }

    public ProjectReportDTO buildReport(Long projectId) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        List<Task> tasks = taskRepo.findByProjectId(projectId)
                .stream().filter(t -> t.getParentTask() == null).toList(); // ← FIXED

        long done       = tasks.stream().filter(t -> t.getStatus().name().equals("DONE")).count();
        long inProgress = tasks.stream().filter(t -> t.getStatus().name().equals("IN_PROGRESS")).count();
        long todo       = tasks.stream().filter(t -> t.getStatus().name().equals("TODO")).count();
        int total = tasks.size();
        int completion = total == 0 ? 0 : (int)((done * 100) / total);
        long overdue = tasks.stream().filter(t ->
                t.getEndDate() != null && t.getEndDate().isBefore(LocalDate.now())
                        && !t.getStatus().name().equals("DONE")).count();

        Double totalHours = timeLogRepo.sumHoursByProjectId(projectId);
        Map<String,Double> hoursPerUser = timeLogRepo.sumHoursByUserForProject(projectId)
                .stream().collect(Collectors.toMap(r -> (String)r[0], r -> (Double)r[1]));

        Map<String, List<Task>> byAssignee = tasks.stream()
                .filter(t -> t.getAssignedTo() != null)
                .collect(Collectors.groupingBy(Task::getAssignedTo));

        List<ProjectReportDTO.MemberStat> memberStats = byAssignee.entrySet().stream()
                .map(e -> {
                    int assigned = e.getValue().size();
                    int memberDone = (int) e.getValue().stream()
                            .filter(t -> t.getStatus().name().equals("DONE")).count();
                    double hours = hoursPerUser.getOrDefault(e.getKey(), 0.0);
                    return ProjectReportDTO.MemberStat.builder()
                            .username(e.getKey()).assigned(assigned).done(memberDone).hoursLogged(hours).build();
                }).sorted(Comparator.comparingInt(ProjectReportDTO.MemberStat::getAssigned).reversed())
                .toList();

        return ProjectReportDTO.builder()
                .projectName(project.getName())
                .ownerUsername(project.getOwnerUsername())
                .startDate(project.getStartDate() != null ? project.getStartDate().toString() : null)
                .endDate(project.getEndDate() != null ? project.getEndDate().toString() : null)
                .totalTasks(total).doneTasks((int)done).inProgressTasks((int)inProgress)
                .todoTasks((int)todo).completionPercent(completion).overdueTasks((int)overdue)
                .totalHoursLogged(totalHours != null ? totalHours : 0.0)
                .memberStats(memberStats).build();
    }
}