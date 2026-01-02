package com.example.demo.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private String id;
    private String email;
    private String password;
    private String name;
    private String role;
    private String phone;
    private Boolean phoneVerified;
    private LocalDate dateOfBirth;
    private String address;
    private String specialization;
    private String license;
    private String imageUrl;
}
