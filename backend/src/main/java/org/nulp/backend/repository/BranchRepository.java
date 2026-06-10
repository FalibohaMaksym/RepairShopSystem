package org.nulp.backend.repository;

import org.nulp.backend.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Integer> {

    @Query("SELECT b FROM Branch b WHERE LOWER(b.branchAddress) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Branch> search(@Param("query") String query);
}
