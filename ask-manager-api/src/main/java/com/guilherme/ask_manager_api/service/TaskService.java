package com.guilherme.ask_manager_api.service;

import com.guilherme.ask_manager_api.model.Task;
import com.guilherme.ask_manager_api.model.TaskPriority;
import com.guilherme.ask_manager_api.repository.TaskRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> findAll() {
        return taskRepository.findAll();
    }

    public Task create(Task task) {

        // Dados controlados pelo backend
        task.setId(null);
        task.setCompleted(false);
        task.setCreatedAt(LocalDateTime.now());

        // Prioridade padrão
        if (task.getPriority() == null) {
            task.setPriority(TaskPriority.MEDIUM);
        }

        validateTask(task);

        return taskRepository.save(task);
    }

    public Task update(Long id, Task updatedTask) {

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Task não encontrada"
                ));

        task.setTitle(updatedTask.getTitle());
        task.setCompleted(updatedTask.getCompleted() != null ? updatedTask.getCompleted() : task.getCompleted());

        // Novos campos
        task.setDescription(updatedTask.getDescription());
        task.setScheduledDate(updatedTask.getScheduledDate());
        task.setStartTime(updatedTask.getStartTime());
        task.setEndTime(updatedTask.getEndTime());

        if (updatedTask.getPriority() != null) {
            task.setPriority(updatedTask.getPriority());
        }

        validateTask(task);

        return taskRepository.save(task);
    }

    public void delete(Long id) {

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Task não encontrada"
                ));

        taskRepository.delete(task);
    }

    private void validateTask(Task task) {

        if (task.getTitle() == null || task.getTitle().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O título da tarefa é obrigatório"
            );
        }

        if (task.getStartTime() != null &&
                task.getEndTime() != null &&
                !task.getEndTime().isAfter(task.getStartTime())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O horário de término deve ser posterior ao início"
            );
        }
    }
}