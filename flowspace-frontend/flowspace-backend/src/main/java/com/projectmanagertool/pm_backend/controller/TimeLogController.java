package com.projectmanagertool.pm_backend.controller;
import com.projectmanagertool.pm_backend.dto.TimeLogDTO;
import com.projectmanagertool.pm_backend.dto.TimeLogRequest;
import com.projectmanagertool.pm_backend.service.TimeLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List; import java.util.Map;

@RestController
@RequestMapping("/api")
public class TimeLogController {
    private final TimeLogService service;
    public TimeLogController(TimeLogService service) { this.service = service; }

    @PostMapping("/tasks/{taskId}/time-logs")
    public TimeLogDTO log(@PathVariable Long taskId,
                          @RequestBody TimeLogRequest req, Authentication auth) {
        return service.log(taskId, req, auth.getName());
    }

    @GetMapping("/tasks/{taskId}/time-logs")
    public List<TimeLogDTO> getForTask(@PathVariable Long taskId) {
        return service.getForTask(taskId);
    }

    @GetMapping("/tasks/{taskId}/time-logs/total")
    public Map<String,Double> totalForTask(@PathVariable Long taskId) {
        return Map.of("totalHours", service.getTotalHoursForTask(taskId));
    }

    @GetMapping("/projects/{projectId}/time-logs/summary")
    public Map<String,Object> projectSummary(@PathVariable Long projectId) {
        return Map.of(
                "totalHours", service.getTotalHoursForProject(projectId),
                "hoursPerUser", service.getHoursPerUserForProject(projectId)
        );
    }

    @DeleteMapping("/time-logs/{logId}")
    public ResponseEntity<String> delete(@PathVariable Long logId, Authentication auth) {
        service.delete(logId, auth.getName());
        return ResponseEntity.ok("Deleted");
    }
}
