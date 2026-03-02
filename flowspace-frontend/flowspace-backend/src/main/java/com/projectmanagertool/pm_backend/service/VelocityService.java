package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.VelocityDTO;
import com.projectmanagertool.pm_backend.model.Task;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;

@Service
public class VelocityService {

    private final TaskRepository taskRepo;

    public VelocityService(TaskRepository taskRepo) { this.taskRepo = taskRepo; }

    public VelocityDTO getVelocity(Long projectId) {
        List<Task> tasks = taskRepo.findByProjectId(projectId);

        Map<String, Integer> doneByWeek    = new TreeMap<>();
        Map<String, Integer> createdByWeek = new TreeMap<>();

        WeekFields wf = WeekFields.ISO;
        for (Task t : tasks) {
            if (t.getParentTask() != null) continue; // ← FIXED: skip subtasks

            if (t.getCreatedAt() != null) {
                LocalDate d = t.getCreatedAt().toLocalDate();
                String wk = weekLabel(d, wf);
                createdByWeek.merge(wk, 1, Integer::sum);
            }
            if (t.getStatus().name().equals("DONE") && t.getUpdatedAt() != null) {
                LocalDate d = t.getUpdatedAt().toLocalDate();
                String wk = weekLabel(d, wf);
                doneByWeek.merge(wk, 1, Integer::sum);
            }
        }

        Set<String> allWeeks = new TreeSet<>();
        allWeeks.addAll(doneByWeek.keySet());
        allWeeks.addAll(createdByWeek.keySet());

        List<VelocityDTO.WeekData> weeks = allWeeks.stream()
                .map(wk -> VelocityDTO.WeekData.builder()
                        .weekLabel(wk)
                        .tasksCompleted(doneByWeek.getOrDefault(wk, 0))
                        .tasksCreated(createdByWeek.getOrDefault(wk, 0))
                        .build())
                .toList();

        double avg = weeks.stream().mapToInt(VelocityDTO.WeekData::getTasksCompleted)
                .average().orElse(0.0);

        return VelocityDTO.builder().weeks(weeks).averagePerWeek(Math.round(avg * 10.0) / 10.0).build();
    }

    private String weekLabel(LocalDate d, WeekFields wf) {
        int year = d.get(wf.weekBasedYear());
        int week = d.get(wf.weekOfWeekBasedYear());
        return year + "-W" + String.format("%02d", week);
    }
}