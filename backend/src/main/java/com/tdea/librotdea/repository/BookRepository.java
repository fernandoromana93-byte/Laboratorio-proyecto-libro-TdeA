package com.tdea.librotdea.repository;

import com.tdea.librotdea.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    // Búsqueda parcial por nombre, sin distinguir mayúsculas/minúsculas (LIKE %name%)
    List<Book> findByNameContainingIgnoreCase(String name);
}
