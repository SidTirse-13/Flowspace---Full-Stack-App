package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.InviteMemberRequest;
import com.projectmanagertool.pm_backend.dto.ProjectMemberDTO;
import com.projectmanagertool.pm_backend.service.ProjectMemberService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/members")
public class ProjectMemberController {

    private final ProjectMemberService memberService;

    public ProjectMemberController(ProjectMemberService memberService) {
        this.memberService = memberService;
    }

    // GET /api/projects/{id}/members — list all members
    @GetMapping
    public List<ProjectMemberDTO> getMembers(@PathVariable Long projectId,
                                             Authentication auth) {
        return memberService.getMembers(projectId, auth.getName());
    }

    // POST /api/projects/{id}/members — invite a member
    @PostMapping
    public ResponseEntity<ProjectMemberDTO> invite(@PathVariable Long projectId,
                                                   @RequestBody InviteMemberRequest request,
                                                   Authentication auth) {
        return ResponseEntity.ok(memberService.invite(projectId, request, auth.getName()));
    }

    // DELETE /api/projects/{id}/members/{username} — remove a member
    @DeleteMapping("/{username}")
    public ResponseEntity<String> removeMember(@PathVariable Long projectId,
                                               @PathVariable String username,
                                               Authentication auth) {
        memberService.removeMember(projectId, username, auth.getName());
        return ResponseEntity.ok("Member removed");
    }

    // GET /api/projects/{id}/members/search?query=... — search invitable users
    @GetMapping("/search")
    public List<?> searchInvitable(@PathVariable Long projectId,
                                   @RequestParam(required = false) String query,
                                   Authentication auth) {
        return memberService.searchInvitableUsers(projectId, query, auth.getName());
    }
}
