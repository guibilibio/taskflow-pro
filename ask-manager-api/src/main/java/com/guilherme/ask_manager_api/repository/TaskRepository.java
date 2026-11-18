package com.guilherme.ask_manager_api.repository;

import com.guilherme.ask_manager_api.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {

}