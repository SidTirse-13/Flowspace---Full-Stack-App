package com.projectmanagertool.pm_backend.dto;

import lombok.Data;

@Data
public class InviteMemberRequest {
    private String username;
    private String memberRole; // MEMBER or PROJECT_MANAGER
}
