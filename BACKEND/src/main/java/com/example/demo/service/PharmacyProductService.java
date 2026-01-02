package com.example.demo.service;

import com.example.demo.entity.PharmacyProduct;
import com.example.demo.dto.PharmacyProductDTO;
import com.example.demo.repository.PharmacyProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PharmacyProductService {
    private final PharmacyProductRepository productRepository;
    private final EntityManager entityManager;

    @Transactional
    public PharmacyProduct createProduct(PharmacyProductDTO dto) {
        PharmacyProduct product = new PharmacyProduct();
        product.setId(UUID.randomUUID().toString());
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setCategory(dto.getCategory());
        product.setInStock(true);
        product.setPrescriptionRequired(dto.getPrescriptionRequired() != null ? dto.getPrescriptionRequired() : false);

        return productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public PharmacyProduct getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @Transactional(readOnly = true)
    public List<PharmacyProduct> getAllInStockProducts() {
        return productRepository.findByInStockTrue();
    }

    @Transactional(readOnly = true)
    public List<PharmacyProduct> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    @Transactional(readOnly = true)
    public List<PharmacyProduct> searchProducts(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    @Transactional
    public PharmacyProduct updateProduct(String id, PharmacyProductDTO dto) {
        PharmacyProduct product = getProductById(id);
        entityManager.detach(product);
        product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));

        if (dto.getPrice() != null) {
            product.setPrice(dto.getPrice());
        }
        if (dto.getInStock() != null) {
            product.setInStock(dto.getInStock());
        }
        if (dto.getDescription() != null) {
            product.setDescription(dto.getDescription());
        }
        if (dto.getCategory() != null) {
            product.setCategory(dto.getCategory());
        }
        if (dto.getPrescriptionRequired() != null) {
            product.setPrescriptionRequired(dto.getPrescriptionRequired());
        }

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(String id) {
        productRepository.deleteById(id);
    }
}
