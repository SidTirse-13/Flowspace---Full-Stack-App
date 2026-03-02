package com.projectmanagertool.pm_backend.dto;
import lombok.*; import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TaskReactionDTO {
    private Long taskId;
    private Map<String, Long> counts;   // {"👍":3, "🔥":1}
    private Map<String, Boolean> mine;  // {"👍":true} — which ones current user reacted
}
