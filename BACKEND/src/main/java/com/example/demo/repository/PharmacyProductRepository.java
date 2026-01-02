package com.example.demo.repository;

import com.example.demo.entity.PharmacyProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PharmacyProductRepository extends JpaRepository<PharmacyProduct, String> {
    List<PharmacyProduct> findByInStockTrue();
    List<PharmacyProduct> findByCategory(String category);
    List<PharmacyProduct> findByNameContainingIgnoreCase(String name);
}
