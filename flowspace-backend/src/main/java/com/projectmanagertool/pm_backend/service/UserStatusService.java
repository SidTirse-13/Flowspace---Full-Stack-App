package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.UserStatusDTO;
import com.projectmanagertool.pm_backend.model.UserStatus;
import com.projectmanagertool.pm_backend.repository.UserStatusRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserStatusService {

    private static final List<String> VALID = List.of("AVAILABLE","BUSY","IN_MEETING","ON_LEAVE","OFFLINE");
    private final UserStatusRepository repo;

    public UserStatusService(UserStatusRepository repo) { this.repo = repo; }

    public UserStatusDTO setStatus(String username, String status, String message) {
        if (!VALID.contains(status)) throw new RuntimeException("Invalid status");
        UserStatus us = repo.findById(username).orElse(new UserStatus());
        us.setUsername(username); us.setStatus(status);
        us.setStatusMessage(message); us.setUpdatedAt(LocalDateTime.now());
        return toDTO(repo.save(us));
    }

    public UserStatusDTO getStatus(String username) {
        return repo.findById(username).map(this::toDTO)
                .orElse(UserStatusDTO.builder().username(username).status("AVAILABLE").build());
    }

    public Map<String,UserStatusDTO> getBulk(List<String> usernames) {
        return repo.findByUsernameIn(usernames).stream()
                .collect(Collectors.toMap(UserStatus::getUsername, this::toDTO));
    }

    private UserStatusDTO toDTO(UserStatus us) {
        return UserStatusDTO.builder().username(us.getUsername())
                .status(us.getStatus()).statusMessage(us.getStatusMessage())
                .updatedAt(us.getUpdatedAt()).build();
    }
}
