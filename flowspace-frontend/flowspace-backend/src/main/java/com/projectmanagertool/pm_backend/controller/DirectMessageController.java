package com.projectmanagertool.pm_backend.controller;
import com.projectmanagertool.pm_backend.dto.DirectMessageDTO;
import com.projectmanagertool.pm_backend.service.DirectMessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List; import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class DirectMessageController {
    private final DirectMessageService service;
    public DirectMessageController(DirectMessageService service) { this.service = service; }

    @GetMapping("/inbox")
    public List<Map<String,Object>> inbox(Authentication auth) {
        return service.getInbox(auth.getName());
    }

    @GetMapping("/with/{username}")
    public List<DirectMessageDTO> conversation(@PathVariable String username, Authentication auth) {
        service.markRead(username, auth.getName());
        return service.getConversation(auth.getName(), username);
    }

    @PostMapping("/send/{username}")
    public DirectMessageDTO send(@PathVariable String username,
                                 @RequestBody Map<String,String> body, Authentication auth) {
        return service.send(auth.getName(), username, body.get("message"));
    }
}
