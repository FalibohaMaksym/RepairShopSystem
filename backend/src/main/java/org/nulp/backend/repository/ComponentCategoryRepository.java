package org.nulp.backend.repository;

import org.nulp.backend.entity.ComponentCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComponentCategoryRepository extends JpaRepository<ComponentCategory, Short> {
}
