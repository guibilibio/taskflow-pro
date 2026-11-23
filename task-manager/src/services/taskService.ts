import type { Task, TaskPriority } from '../types/Task'

const API_URL = `${
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
}/tasks`

export type CreateTaskRequest = {
  title: string
  description?: string | null
  scheduledDate?: string | null
  startTime?: string | null
  endTime?: string | null
  priority?: TaskPriority
}

export async function getTasks(): Promise<Task[]> {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Erro ao buscar tarefas')
  }

  return response.json()
}

export async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    throw new Error(`Erro ao excluir tarefa: ${response.status}`)
  }
}

export async function updateTask(task: Task): Promise<Task> {
  const response = await fetch(`${API_URL}/${task.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  })

  if (!response.ok) {
    throw new Error(`Erro ao atualizar tarefa: ${response.status}`)
  }

  return response.json()
}

export async function createTask(
  data: CreateTaskRequest
): Promise<Task> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error(`Erro ao criar tarefa: ${response.status}`)
  }

  return response.json()
}