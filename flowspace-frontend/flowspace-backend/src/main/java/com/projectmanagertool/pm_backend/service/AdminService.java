package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.AdminUserDTO;
import com.projectmanagertool.pm_backend.model.User;
import com.projectmanagertool.pm_backend.repository.ProjectMemberRepository;
import com.projectmanagertool.pm_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ProjectMemberRepository memberRepository;

    public AdminService(UserRepository userRepository,
                        ProjectMemberRepository memberRepository) {
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
    }

    // ── LIST ALL USERS ────────────────────────────────────────────
    public List<AdminUserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDTO).toList();
    }

    // ── SEARCH USERS ──────────────────────────────────────────────
    public List<AdminUserDTO> searchUsers(String query) {
        if (query == null || query.isBlank()) return getAllUsers();
        String q = query.toLowerCase();
        return userRepository.findAll().stream()
                .filter(u -> u.getUsername().toLowerCase().contains(q)
                        || u.getEmail().toLowerCase().contains(q))
                .map(this::toDTO).toList();
    }

    // ── DELETE USER (Admin only) ──────────────────────────────────
    // Removes the user and all their project memberships
    @Transactional
    public void deleteUser(Long userId, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getUsername().equals(adminUsername)) {
            throw new RuntimeException("You cannot delete your own account");
        }

        // Remove from all projects they were a member of
        memberRepository.findByUsername(user.getUsername())
                .forEach(memberRepository::delete);

        userRepository.delete(user);
    }

    // ── CHANGE USER ROLE (Admin only) ────────────────────────────
    public AdminUserDTO updateUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!List.of("USER", "PROJECT_MANAGER", "ADMIN").contains(newRole)) {
            throw new RuntimeException("Invalid role: " + newRole);
        }

        user.setRole(newRole);
        return toDTO(userRepository.save(user));
    }

    private AdminUserDTO toDTO(User u) {
        return AdminUserDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .build();
    }
}
