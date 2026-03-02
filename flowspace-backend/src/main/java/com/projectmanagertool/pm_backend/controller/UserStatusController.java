package com.projectmanagertool.pm_backend.controller;
import com.projectmanagertool.pm_backend.dto.UserStatusDTO;
import com.projectmanagertool.pm_backend.service.UserStatusService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List; import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserStatusController {
    private final UserStatusService service;
    public UserStatusController(UserStatusService service) { this.service = service; }

    @PutMapping("/me/status")
    public UserStatusDTO setStatus(@RequestBody Map<String,String> body, Authentication auth) {
        return service.setStatus(auth.getName(), body.get("status"), body.get("statusMessage"));
    }

    @GetMapping("/{username}/status")
    public UserStatusDTO getStatus(@PathVariable String username) {
        return service.getStatus(username);
    }

    @PostMapping("/bulk-status")
    public Map<String,UserStatusDTO> bulkStatus(@RequestBody List<String> usernames) {
        return service.getBulk(usernames);
    }
}
