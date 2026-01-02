package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyProductDTO {
    private String id;
    private String name;
    private String description;
    private Float price;
    private String category;
    private Boolean inStock;
    private String imageUrl;
    private Boolean prescriptionRequired;
}
