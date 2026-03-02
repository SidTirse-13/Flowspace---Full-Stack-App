package com.projectmanagertool.pm_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    // Allowed MIME types for security
    private static final java.util.Set<String> ALLOWED_TYPES = java.util.Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf",
            "text/plain", "text/csv",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/zip"
    );

    // Max 10 MB
    private static final long MAX_SIZE = 10 * 1024 * 1024;

    // ── Store file ────────────────────────────────────────────────
    public String storeFile(MultipartFile file) throws IOException {
        // Validate
        if (file.isEmpty()) throw new RuntimeException("File is empty");
        if (file.getSize() > MAX_SIZE) throw new RuntimeException("File exceeds 10MB limit");
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new RuntimeException("File type not allowed: " + file.getContentType());
        }

        // Create directory
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        // Unique filename: uuid + original extension
        String original  = file.getOriginalFilename();
        String extension = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf("."))
                : "";
        String stored = UUID.randomUUID().toString() + extension;

        // Write to disk
        Files.copy(file.getInputStream(),
                uploadPath.resolve(stored),
                StandardCopyOption.REPLACE_EXISTING);

        return stored; // Return stored filename to save in DB
    }

    // ── Load file as bytes ────────────────────────────────────────
    public byte[] loadFile(String storedFileName) throws IOException {
        Path path = Paths.get(uploadDir).resolve(storedFileName);
        if (!Files.exists(path)) throw new RuntimeException("File not found on server");
        return Files.readAllBytes(path);
    }

    // ── Delete file ───────────────────────────────────────────────
    public void deleteFile(String storedFileName) {
        try {
            Path path = Paths.get(uploadDir).resolve(storedFileName);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            System.err.println("⚠ Could not delete file " + storedFileName + ": " + e.getMessage());
        }
    }
}
