package com.projectmanagertool.pm_backend.controller;
import com.projectmanagertool.pm_backend.dto.VelocityDTO;
import com.projectmanagertool.pm_backend.dto.ProjectReportDTO;
import com.projectmanagertool.pm_backend.service.VelocityService;
import com.projectmanagertool.pm_backend.service.ProjectReportService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects/{projectId}")
public class VelocityController {
    private final VelocityService velocityService;
    private final ProjectReportService reportService;

    public VelocityController(VelocityService velocityService, ProjectReportService reportService) {
        this.velocityService = velocityService;
        this.reportService   = reportService;
    }

    @GetMapping("/velocity")
    public VelocityDTO velocity(@PathVariable Long projectId) {
        return velocityService.getVelocity(projectId);
    }

    @GetMapping("/report")
    public ProjectReportDTO report(@PathVariable Long projectId) {
        return reportService.buildReport(projectId);
    }
}
