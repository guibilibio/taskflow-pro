package com.guilherme.ask_manager_api.controller;

import com.guilherme.ask_manager_api.model.Task;
import com.guilherme.ask_manager_api.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://taskflow-pro-v1.vercel.app"
})
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<Task> findAll() {
        return taskService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task create(@RequestBody Task task) {
        return taskService.create(task);
    }

    @PutMapping("/{id}")
    public Task update(
            @PathVariable Long id,
            @RequestBody Task task
    ) {
        return taskService.update(id, task);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        taskService.delete(id);
    }
}