package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.InviteMemberRequest;
import com.projectmanagertool.pm_backend.dto.ProjectMemberDTO;
import com.projectmanagertool.pm_backend.exception.ProjectNotFoundException;
import com.projectmanagertool.pm_backend.exception.UnauthorizedException;
import com.projectmanagertool.pm_backend.model.Project;
import com.projectmanagertool.pm_backend.model.ProjectMember;
import com.projectmanagertool.pm_backend.model.User;
import com.projectmanagertool.pm_backend.repository.ProjectMemberRepository;
import com.projectmanagertool.pm_backend.repository.ProjectRepository;
import com.projectmanagertool.pm_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectMemberService {

    private final ProjectMemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectMemberService(ProjectMemberRepository memberRepository,
                                ProjectRepository projectRepository,
                                UserRepository userRepository) {
        this.memberRepository = memberRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    // ── GET MEMBERS ───────────────────────────────────────────────
    public List<ProjectMemberDTO> getMembers(Long projectId, String requester) {
        assertMemberOrOwner(projectId, requester);
        return memberRepository.findByProjectId(projectId)
                .stream().map(this::toDTO).toList();
    }

    // ── INVITE MEMBER ─────────────────────────────────────────────
    public ProjectMemberDTO invite(Long projectId, InviteMemberRequest request, String invitedBy) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        assertCanManageMembers(project, projectId, invitedBy);

        // Validate target user exists
        User target = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException(
                        "User '" + request.getUsername() + "' not found"));

        if (memberRepository.existsByProjectIdAndUsername(projectId, request.getUsername())) {
            throw new RuntimeException("User is already a member of this project");
        }

        // Cannot invite the owner — they are already implicitly the owner
        if (project.getOwnerUsername().equals(request.getUsername())) {
            throw new RuntimeException("Project owner is already part of this project");
        }

        String role = (request.getMemberRole() != null &&
                request.getMemberRole().equals("PROJECT_MANAGER"))
                ? "PROJECT_MANAGER" : "MEMBER";

        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUsername(request.getUsername());
        member.setMemberRole(role);

        return toDTO(memberRepository.save(member));
    }

    // ── REMOVE MEMBER ─────────────────────────────────────────────
    @Transactional
    public void removeMember(Long projectId, String targetUsername, String removedBy) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        assertCanManageMembers(project, projectId, removedBy);

        if (project.getOwnerUsername().equals(targetUsername)) {
            throw new RuntimeException("Cannot remove the project owner");
        }

        memberRepository.deleteByProjectIdAndUsername(projectId, targetUsername);
    }

    // ── SEARCH USERS TO INVITE (returns users NOT already in project) ──
    public List<AdminUserDTO_mini> searchInvitableUsers(Long projectId, String query, String requester) {
        assertCanManageMembers(projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found")), projectId, requester);

        List<String> existingUsernames = memberRepository.findByProjectId(projectId)
                .stream().map(ProjectMember::getUsername).toList();

        return userRepository.findAll().stream()
                .filter(u -> !existingUsernames.contains(u.getUsername()))
                .filter(u -> query == null || query.isBlank()
                        || u.getUsername().toLowerCase().contains(query.toLowerCase()))
                .map(u -> new AdminUserDTO_mini(u.getId(), u.getUsername(), u.getEmail(), u.getRole()))
                .limit(20)
                .toList();
    }

    // ── HELPER: check if user is owner or project manager ────────
    private void assertCanManageMembers(Project project, Long projectId, String username) {
        boolean isOwner = project.getOwnerUsername().equals(username);
        if (isOwner) return;

        // Also allow PROJECT_MANAGER role members and global ADMINs
        boolean isPM = memberRepository.findByProjectIdAndUsername(projectId, username)
                .map(m -> m.getMemberRole().equals("PROJECT_MANAGER"))
                .orElse(false);

        boolean isAdmin = userRepository.findByUsername(username)
                .map(u -> u.getRole().equals("ADMIN"))
                .orElse(false);

        if (!isPM && !isAdmin) {
            throw new UnauthorizedException("Only project owner, project manager, or admin can manage members");
        }
    }

    private void assertMemberOrOwner(Long projectId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
        if (project.getOwnerUsername().equals(username)) return;
        if (memberRepository.existsByProjectIdAndUsername(projectId, username)) return;
        // Also allow global ADMINs
        boolean isAdmin = userRepository.findByUsername(username)
                .map(u -> u.getRole().equals("ADMIN")).orElse(false);
        if (!isAdmin) throw new UnauthorizedException("You are not a member of this project");
    }

    private ProjectMemberDTO toDTO(ProjectMember m) {
        User user = userRepository.findByUsername(m.getUsername()).orElse(null);
        return ProjectMemberDTO.builder()
                .id(m.getId())
                .username(m.getUsername())
                .email(user != null ? user.getEmail() : null)
                .memberRole(m.getMemberRole())
                .joinedAt(m.getJoinedAt())
                .build();
    }

    // Mini DTO for search results
    public record AdminUserDTO_mini(Long id, String username, String email, String role) {}
}
