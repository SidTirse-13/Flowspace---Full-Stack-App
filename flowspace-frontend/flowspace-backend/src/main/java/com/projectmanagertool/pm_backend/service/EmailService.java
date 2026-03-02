package com.projectmanagertool.pm_backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) { this.mailSender = mailSender; }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to); msg.setSubject(subject); msg.setText(body);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠ Email failed for " + to + ": " + e.getMessage());
        }
    }

    public void sendOverdueReminder(String toEmail, String username,
                                    String taskTitle, String projectName, String endDate) {
        send(toEmail, "⚠️ Overdue Task: " + taskTitle,
                "Hi " + username + ",\n\nThis task is overdue:\n\n" +
                        "  📌 Task:    " + taskTitle + "\n" +
                        "  📂 Project: " + projectName + "\n" +
                        "  📅 Due:     " + endDate + "\n\n" +
                        "Please update the task status or extend the deadline.\n\n— ProjectFlow");
    }

    public void sendDeadlineReminder(String toEmail, String username,
                                     String taskTitle, String projectName, String endDate) {
        send(toEmail, "📅 Task Due Tomorrow: " + taskTitle,
                "Hi " + username + ",\n\nHeads up! This task is due tomorrow:\n\n" +
                        "  📌 Task:    " + taskTitle + "\n" +
                        "  📂 Project: " + projectName + "\n" +
                        "  📅 Due:     " + endDate + "\n\n— ProjectFlow");
    }

    public void sendTaskAssigned(String toEmail, String username,
                                 String taskTitle, String projectName, String assignedBy) {
        send(toEmail, "📌 New Task Assigned: " + taskTitle,
                "Hi " + username + ",\n\n" + assignedBy + " assigned you a task:\n\n" +
                        "  📌 Task:    " + taskTitle + "\n" +
                        "  📂 Project: " + projectName + "\n\n" +
                        "Log in to view details: http://localhost:3000\n\n— ProjectFlow");
    }

    public void sendMentionNotification(String toEmail, String username,
                                        String mentionedBy, String projectName, String snippet) {
        send(toEmail, "💬 You were mentioned in " + projectName,
                "Hi " + username + ",\n\n" + mentionedBy + " mentioned you in " + projectName + ":\n\n" +
                        "\"" + snippet + "\"\n\n" +
                        "Log in to respond: http://localhost:3000\n\n— ProjectFlow");
    }

    public void sendWeeklyDigest(String toEmail, String username,
                                 int dueSoon, int overdue, int assignedTotal) {
        send(toEmail, "📊 Your Weekly ProjectFlow Digest",
                "Hi " + username + ",\n\nHere's your weekly summary:\n\n" +
                        "  📋 Total tasks assigned:  " + assignedTotal + "\n" +
                        "  ⏰ Tasks due this week:   " + dueSoon + "\n" +
                        "  ⚠️  Overdue tasks:         " + overdue + "\n\n" +
                        "Log in to stay on track: http://localhost:3000\n\n— ProjectFlow");
    }
}
