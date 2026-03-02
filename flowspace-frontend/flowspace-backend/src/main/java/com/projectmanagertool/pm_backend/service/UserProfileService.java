package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.UserProfileDTO;
import com.projectmanagertool.pm_backend.model.User;
import com.projectmanagertool.pm_backend.repository.ProjectMemberRepository;
import com.projectmanagertool.pm_backend.repository.ProjectRepository;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import com.projectmanagertool.pm_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    public UserProfileService(UserRepository userRepository,
                              TaskRepository taskRepository,
                              ProjectRepository projectRepository,
                              ProjectMemberRepository memberRepository) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
    }

    public UserProfileDTO getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        var allTasks = taskRepository.findByAssignedTo(username);
        int totalAssigned = allTasks.size();
        int totalDone = (int) allTasks.stream()
                .filter(t -> t.getStatus().name().equals("DONE")).count();

        // Count projects: owned + member
        long ownedCount  = projectRepository.findByOwnerUsername(username).size();
        long memberCount = memberRepository.findByUsername(username).size();
        int totalProjects = (int)(ownedCount + memberCount);

        // Deterministic avatar color from username hash
        String[] palette = {"#6c63ff","#00d4aa","#ffd166","#ff6b6b","#00b4d8","#a09bff","#ff9b9b"};
        String avatarColor = palette[Math.abs(username.hashCode()) % palette.length];

        return UserProfileDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .bio(null)
                .avatarColor(avatarColor)
                .totalTasksAssigned(totalAssigned)
                .totalTasksDone(totalDone)
                .totalProjects(totalProjects)
                .build();
    }

    // Search users for @mention autocomplete
    public List<Map<String,String>> searchForMention(String query) {
        return userRepository.findAll().stream()
                .filter(u -> query == null || query.isBlank() ||
                        u.getUsername().toLowerCase().contains(query.toLowerCase()))
                .limit(8)
                .map(u -> Map.of("username", u.getUsername(), "role", u.getRole()))
                .toList();
    }
}
