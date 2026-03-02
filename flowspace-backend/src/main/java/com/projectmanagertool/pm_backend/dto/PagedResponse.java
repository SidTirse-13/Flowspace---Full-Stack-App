package com.projectmanagertool.pm_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PagedResponse<T> {

    private List<T> data;
    private int currentPage;
    private int totalPages;
    private long totalItems;
}