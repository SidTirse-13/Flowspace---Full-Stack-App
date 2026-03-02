package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.UserProfileDTO;
import com.projectmanagertool.pm_backend.service.UserProfileService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService profileService;

    public UserProfileController(UserProfileService profileService) {
        this.profileService = profileService;
    }

    // GET /api/users/{username}/profile
    @GetMapping("/{username}/profile")
    public UserProfileDTO getProfile(@PathVariable String username) {
        return profileService.getProfile(username);
    }

    // GET /api/users/me/profile
    @GetMapping("/me/profile")
    public UserProfileDTO getMyProfile(Authentication auth) {
        return profileService.getProfile(auth.getName());
    }

    // GET /api/users/mention-search?query=...
    @GetMapping("/mention-search")
    public List<Map<String,String>> mentionSearch(
            @RequestParam(required = false) String query) {
        return profileService.searchForMention(query);
    }
}
