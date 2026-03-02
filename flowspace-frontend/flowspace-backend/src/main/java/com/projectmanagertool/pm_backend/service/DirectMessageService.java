package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.DirectMessageDTO;
import com.projectmanagertool.pm_backend.model.DirectMessage;
import com.projectmanagertool.pm_backend.repository.DirectMessageRepository;
import com.projectmanagertool.pm_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DirectMessageService {

    private final DirectMessageRepository dmRepo;
    private final UserRepository userRepo;

    public DirectMessageService(DirectMessageRepository dmRepo, UserRepository userRepo) {
        this.dmRepo = dmRepo; this.userRepo = userRepo;
    }

    public List<DirectMessageDTO> getConversation(String me, String other) {
        return dmRepo.findConversation(me, other).stream().map(this::toDTO).toList();
    }

    public DirectMessageDTO send(String from, String to, String message) {
        userRepo.findByUsername(to).orElseThrow(() -> new RuntimeException("User not found: " + to));
        DirectMessage dm = new DirectMessage();
        dm.setSenderUsername(from); dm.setRecipientUsername(to);
        dm.setMessage(message.trim()); dm.setRead(false);
        return toDTO(dmRepo.save(dm));
    }

    @Transactional
    public void markRead(String sender, String recipient) {
        dmRepo.markConversationRead(sender, recipient);
    }

    public List<Map<String,Object>> getInbox(String username) {
        return dmRepo.findConversationPartners(username).stream().map(partner -> {
            long unread = dmRepo.countBySenderUsernameAndRecipientUsernameAndIsReadFalse(partner, username);
            return Map.<String,Object>of("username", partner, "unreadCount", unread);
        }).collect(Collectors.toList());
    }

    private DirectMessageDTO toDTO(DirectMessage dm) {
        return DirectMessageDTO.builder()
                .id(dm.getId()).senderUsername(dm.getSenderUsername())
                .recipientUsername(dm.getRecipientUsername())
                .message(dm.getMessage()).read(dm.isRead()).sentAt(dm.getSentAt()).build();
    }
}
