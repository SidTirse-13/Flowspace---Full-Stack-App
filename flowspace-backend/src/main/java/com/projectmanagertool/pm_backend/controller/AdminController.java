package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.AdminUserDTO;
import com.projectmanagertool.pm_backend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // GET /api/admin/users — list all users
    @GetMapping("/users")
    public List<AdminUserDTO> getAllUsers() {
        return adminService.getAllUsers();
    }

    // GET /api/admin/users/search?query=... — search users
    @GetMapping("/users/search")
    public List<AdminUserDTO> searchUsers(@RequestParam(required = false) String query) {
        return adminService.searchUsers(query);
    }

    // DELETE /api/admin/users/{id} — remove a user from the platform
    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id, Authentication auth) {
        adminService.deleteUser(id, auth.getName());
        return ResponseEntity.ok("User deleted");
    }

    // PUT /api/admin/users/{id}/role — change a user's role
    @PutMapping("/users/{id}/role")
    public ResponseEntity<AdminUserDTO> updateRole(@PathVariable Long id,
                                                   @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminService.updateUserRole(id, body.get("role")));
    }
}
