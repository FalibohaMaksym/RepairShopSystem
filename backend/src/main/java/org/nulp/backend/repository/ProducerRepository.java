package org.nulp.backend.repository;

import org.nulp.backend.entity.Producer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProducerRepository extends JpaRepository<Producer, Integer> {

    @Query("SELECT DISTINCT p FROM Producer p WHERE EXISTS (SELECT c FROM Component c WHERE c.producer = p)")
    List<Producer> findAllWithComponents();
}
