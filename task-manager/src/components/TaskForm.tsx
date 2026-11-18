import { useState } from 'react'
import type { FormEvent } from 'react'
import type { TaskPriority } from '../types/Task'
import type { CreateTaskRequest } from '../services/taskService'

type TaskFormProps = {
  onSubmit: (data: CreateTaskRequest) => Promise<void>
  saving: boolean
}

function TaskForm({ onSubmit, saving }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim() || saving) return

    if (startTime && endTime && endTime <= startTime) {
      alert('O horário de término deve ser posterior ao início.')
      return
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        scheduledDate: scheduledDate || null,
        startTime: startTime || null,
        endTime: endTime || null,
        priority
      })

      setTitle('')
      setDescription('')
      setScheduledDate('')
      setStartTime('')
      setEndTime('')
      setPriority('MEDIUM')
    } catch {
      // O App.tsx será responsável por exibir o erro.
    }
  }

  return (
    <form className="advanced-task-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="task-title">Título</label>
        <input
          id="task-title"
          type="text"
          placeholder="O que você precisa fazer?"
          value={title}
          onChange={event => setTitle(event.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="task-description">Descrição</label>
        <textarea
          id="task-description"
          placeholder="Adicione detalhes sobre sua tarefa..."
          value={description}
          onChange={event => setDescription(event.target.value)}
          rows={3}
        />
      </div>

      <div className="form-field">
        <label htmlFor="task-date">Data planejada</label>
        <input
          id="task-date"
          type="date"
          value={scheduledDate}
          onChange={event => setScheduledDate(event.target.value)}
        />
      </div>

      <div className="form-time-grid">
        <div className="form-field">
          <label htmlFor="task-start">Início</label>
          <input
            id="task-start"
            type="time"
            value={startTime}
            onChange={event => setStartTime(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="task-end">Término</label>
          <input
            id="task-end"
            type="time"
            value={endTime}
            onChange={event => setEndTime(event.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="task-priority">Prioridade</label>
        <select
          id="task-priority"
          value={priority}
          onChange={event =>
            setPriority(event.target.value as TaskPriority)
          }
        >
          <option value="LOW">🟢 Baixa</option>
          <option value="MEDIUM">🟡 Média</option>
          <option value="HIGH">🔴 Alta</option>
        </select>
      </div>

      <button
        type="submit"
        className="add-button"
        disabled={saving || !title.trim()}
      >
        {saving ? 'Salvando...' : '+ Criar tarefa'}
      </button>
    </form>
  )
}

export default TaskForm