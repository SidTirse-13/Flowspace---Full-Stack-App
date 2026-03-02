package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.LoginRequest;
import com.projectmanagertool.pm_backend.model.User;
import com.projectmanagertool.pm_backend.repository.ProjectMemberRepository;
import com.projectmanagertool.pm_backend.repository.UserRepository;
import com.projectmanagertool.pm_backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private UserRepository        userRepository;
    @Autowired private BCryptPasswordEncoder  passwordEncoder;
    @Autowired private JwtService             jwtService;

    // Allowed roles during self-registration
    private static final List<String> ALLOWED_ROLES = List.of("USER", "PROJECT_MANAGER", "ADMIN");

    // ── REGISTER ──────────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already taken");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered");
        }

        // Validate and default role
        String role = user.getRole();
        if (role == null || role.isBlank() || !ALLOWED_ROLES.contains(role.toUpperCase())) {
            role = "USER";
        }
        user.setRole(role.toUpperCase());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    // ── LOGIN — returns token + user info ─────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }
        String token = jwtService.generateToken(user.getUsername());
        // Return token + role so the frontend can store and use the role
        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", user.getUsername(),
                "role", user.getRole(),
                "email", user.getEmail()
        ));
    }

    // ── GET CURRENT USER INFO ─────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "role", user.getRole(),
                "email", user.getEmail(),
                "id", user.getId()
        ));
    }
}
