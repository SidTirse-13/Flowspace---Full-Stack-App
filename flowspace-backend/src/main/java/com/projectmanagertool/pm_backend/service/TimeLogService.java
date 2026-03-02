package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.TimeLogDTO;
import com.projectmanagertool.pm_backend.dto.TimeLogRequest;
import com.projectmanagertool.pm_backend.model.Task;
import com.projectmanagertool.pm_backend.model.TimeLog;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import com.projectmanagertool.pm_backend.repository.TimeLogRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TimeLogService {

    private final TimeLogRepository timeLogRepo;
    private final TaskRepository taskRepo;

    public TimeLogService(TimeLogRepository timeLogRepo, TaskRepository taskRepo) {
        this.timeLogRepo = timeLogRepo; this.taskRepo = taskRepo;
    }

    public TimeLogDTO log(Long taskId, TimeLogRequest req, String username) {
        if (req.getHours() <= 0 || req.getHours() > 24)
            throw new RuntimeException("Hours must be between 0 and 24");
        Task task = taskRepo.findById(taskId).orElseThrow(() -> new RuntimeException("Task not found"));
        TimeLog tl = new TimeLog();
        tl.setTask(task); tl.setUsername(username);
        tl.setHours(req.getHours()); tl.setNote(req.getNote());
        tl.setLogDate(req.getLogDate() != null ? req.getLogDate() : LocalDate.now());
        return toDTO(timeLogRepo.save(tl));
    }

    public List<TimeLogDTO> getForTask(Long taskId) {
        return timeLogRepo.findByTaskIdOrderByLogDateDesc(taskId).stream().map(this::toDTO).toList();
    }

    public double getTotalHoursForTask(Long taskId) {
        Double total = timeLogRepo.sumHoursByTaskId(taskId);
        return total != null ? total : 0.0;
    }

    public double getTotalHoursForProject(Long projectId) {
        Double total = timeLogRepo.sumHoursByProjectId(projectId);
        return total != null ? total : 0.0;
    }

    public Map<String,Double> getHoursPerUserForProject(Long projectId) {
        return timeLogRepo.sumHoursByUserForProject(projectId).stream()
                .collect(Collectors.toMap(r -> (String)r[0], r -> (Double)r[1]));
    }

    public void delete(Long logId, String username) {
        TimeLog tl = timeLogRepo.findById(logId).orElseThrow(() -> new RuntimeException("Log not found"));
        if (!tl.getUsername().equals(username)) throw new RuntimeException("Cannot delete another user's log");
        timeLogRepo.delete(tl);
    }

    private TimeLogDTO toDTO(TimeLog tl) {
        return TimeLogDTO.builder()
                .id(tl.getId()).taskId(tl.getTask().getId())
                .taskTitle(tl.getTask().getTitle())
                .username(tl.getUsername()).hours(tl.getHours())
                .note(tl.getNote()).logDate(tl.getLogDate()).createdAt(tl.getCreatedAt()).build();
    }
}
