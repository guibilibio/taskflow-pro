import { useEffect, useMemo, useState } from 'react'
import type { Task, TaskPriority } from './types/Task'
import type { CreateTaskRequest } from './services/taskService'
import { getTasks, createTask, updateTask, deleteTask } from './services/taskService'
import './App.css'

type View = 'week' | 'day' | 'month'
type Section = 'calendar' | 'dashboard' | 'tasks'
type FormData = { title: string; description: string; scheduledDate: string; startTime: string; endTime: string; priority: TaskPriority }
const emptyForm = (date: string): FormData => ({ title: '', description: '', scheduledDate: date, startTime: '', endTime: '', priority: 'MEDIUM' })
const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const pad = (n: number) => String(n).padStart(2, '0')
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
const parseDate = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d) }
const addDays = (d: Date, n: number) => { const next = new Date(d); next.setDate(next.getDate()+n); return next }
const startWeek = (d: Date) => addDays(d, -((d.getDay()+6)%7))
const fmtDate = (d: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', options).format(d)
const timeShort = (s: string | null) => s?.slice(0,5) || ''
const taskDate = (t: Task) => t.scheduledDate || t.createdAt.slice(0,10)
const priorityName: Record<TaskPriority,string> = { HIGH:'Alta', MEDIUM:'Média', LOW:'Baixa' }
const hours = Array.from({length: 17},(_,i)=>i+6)

function App() {
  const [tasks,setTasks] = useState<Task[]>([])
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [busyId,setBusyId] = useState<number | null>(null)
  const [error,setError] = useState('')
  const [section,setSection] = useState<Section>('calendar')
  const [view,setView] = useState<View>('week')
  const [selected,setSelected] = useState(dateKey(new Date()))
  const [modal,setModal] = useState(false)
  const [editing,setEditing] = useState<Task | null>(null)
  const [form,setForm] = useState<FormData>(emptyForm(dateKey(new Date())))
  const [search,setSearch] = useState('')
  const [filter,setFilter] = useState<'all'|'pending'|'completed'>('all')

  useEffect(()=>{ getTasks().then(setTasks).catch(()=>setError('Não foi possível carregar as tarefas. Confira se a API está ligada.')).finally(()=>setLoading(false)) },[])
  const selectedDate = parseDate(selected)
  const weekStart = startWeek(selectedDate)
  const weekDays = Array.from({length:7},(_,i)=>addDays(weekStart,i))
  const visibleTasks = useMemo(()=>tasks.filter(t=>{
    const match = `${t.title} ${t.description||''}`.toLowerCase().includes(search.toLowerCase())
    return match && (filter==='all'||(filter==='completed'?t.completed:!t.completed))
  }),[tasks,search,filter])
  const completed = tasks.filter(t=>t.completed).length
  const percent = tasks.length ? Math.round(completed/tasks.length*100):0
  const weekCount = tasks.filter(t=>{const d=taskDate(t);return d>=dateKey(weekStart)&&d<=dateKey(addDays(weekStart,6))}).length
  const selectedTasks = visibleTasks.filter(t=>taskDate(t)===selected).sort((a,b)=>(a.startTime||'99').localeCompare(b.startTime||'99'))

  function openNew(date=selected,hour='') { setEditing(null);setForm({...emptyForm(date),startTime:hour});setModal(true);setError('') }
  function openEdit(task:Task) {setEditing(task);setForm({title:task.title,description:task.description||'',scheduledDate:task.scheduledDate||'',startTime:timeShort(task.startTime),endTime:timeShort(task.endTime),priority:task.priority||'MEDIUM'});setModal(true);setError('')}
  function changeForm<K extends keyof FormData>(key:K,value:FormData[K]) {setForm(f=>({...f,[key]:value}))}
  async function submitTask(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if(!form.title.trim()) {setError('Informe o título da tarefa.');return}
    if(form.startTime&&form.endTime&&form.endTime<=form.startTime) {setError('O término precisa ser posterior ao início.');return}
    setSaving(true);setError('')
    const payload:CreateTaskRequest={title:form.title.trim(),description:form.description.trim()||null,scheduledDate:form.scheduledDate||null,startTime:form.startTime||null,endTime:form.endTime||null,priority:form.priority}
    try {
      if(editing){const updated=await updateTask({...editing,...payload,description:payload.description||null,scheduledDate:payload.scheduledDate||null,startTime:payload.startTime||null,endTime:payload.endTime||null,priority:payload.priority||'MEDIUM'});setTasks(prev=>prev.map(t=>t.id===updated.id?updated:t))}
      else {const created=await createTask(payload);setTasks(prev=>[...prev,created]);if(created.scheduledDate)setSelected(created.scheduledDate)}
      setModal(false)
    } catch {setError('Não foi possível salvar a tarefa. Verifique os campos e a conexão com a API.')} finally {setSaving(false)}
  }
  async function toggleTask(task:Task){if(busyId!==null)return;setBusyId(task.id);setError('');try{const result=await updateTask({...task,completed:!task.completed});setTasks(prev=>prev.map(t=>t.id===task.id?result:t))}catch{setError('Não foi possível atualizar a tarefa.')}finally{setBusyId(null)}}
  async function removeTask(task:Task){if(!window.confirm(`Excluir “${task.title}”?`))return;setBusyId(task.id);setError('');try{await deleteTask(task.id);setTasks(prev=>prev.filter(t=>t.id!==task.id));setModal(false)}catch{setError('Não foi possível excluir a tarefa.')}finally{setBusyId(null)}}
  function navigate(delta:number){if(view==='month'){const d=new Date(selectedDate.getFullYear(),selectedDate.getMonth()+delta,1);setSelected(dateKey(d))}else setSelected(dateKey(addDays(selectedDate,delta*(view==='week'?7:1))))}
  const monthFirst = new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1)
  const monthGridStart=startWeek(monthFirst)
  const monthCells=Array.from({length:42},(_,i)=>addDays(monthGridStart,i))
  const label = view==='week'?`${fmtDate(weekStart,{day:'2-digit',month:'short'})} – ${fmtDate(addDays(weekStart,6),{day:'2-digit',month:'short',year:'numeric'})}`:view==='day'?fmtDate(selectedDate,{weekday:'long',day:'numeric',month:'long',year:'numeric'}):fmtDate(selectedDate,{month:'long',year:'numeric'})

  function taskCard(task:Task,compact=false){return <div className={`task-card priority-${task.priority.toLowerCase()} ${task.completed?'done':''} ${compact?'compact':''}`} key={task.id}>
    <input aria-label={`Concluir ${task.title}`} type="checkbox" checked={task.completed} disabled={busyId!==null} onChange={()=>toggleTask(task)}/>
    <button type="button" className="task-card-content" onClick={()=>openEdit(task)}><strong>{task.title}</strong>{!compact&&task.description&&<small>{task.description}</small>}<span className="task-card-meta">{task.scheduledDate?fmtDate(parseDate(task.scheduledDate),{day:'2-digit',month:'2-digit'}):'Sem data'} {task.startTime&&` · ${timeShort(task.startTime)}${task.endTime?' – '+timeShort(task.endTime):''}`}</span></button>
    {!compact&&<span className={`priority-badge ${task.priority.toLowerCase()}`}>{priorityName[task.priority]}</span>}
    <button type="button" className="icon-button edit-task" aria-label={`Editar ${task.title}`} onClick={()=>openEdit(task)}>✎</button>
  </div>}

  function calendarTask(task:Task){return <button type="button" key={task.id} className={`calendar-event priority-${task.priority.toLowerCase()} ${task.completed?'event-done':''}`} onClick={()=>openEdit(task)} title={`${task.title} — editar`}><strong>{task.title}</strong><small>{timeShort(task.startTime)}{task.endTime?' – '+timeShort(task.endTime):''}</small></button>}

  return <div className="app-layout">
    <aside className="sidebar"><div className="brand"><span className="brand-icon">✓</span><span>TaskFlow <b>PRO</b></span></div><div className="sidebar-section">NAVEGAÇÃO</div><nav className="sidebar-nav">
      <button className={`nav-item ${section==='dashboard'?'active':''}`} onClick={()=>setSection('dashboard')}><span>▦</span> Dashboard</button>
      <button className={`nav-item ${section==='tasks'?'active':''}`} onClick={()=>setSection('tasks')}><span>☑</span> Tarefas</button>
      <button className={`nav-item ${section==='calendar'?'active':''}`} onClick={()=>setSection('calendar')}><span>▣</span> Calendário</button>
    </nav><div className="sidebar-footer"><span className="avatar">G</span><div><strong>Meu Workspace</strong><small>Plano pessoal</small></div></div></aside>
    <main className="main-content"><header className="page-header"><div><span className="eyebrow">TASKFLOW / {section==='calendar'?'PLANEJAMENTO':section==='tasks'?'TAREFAS':'VISÃO GERAL'}</span><h1>{section==='calendar'?'Meu calendário':section==='tasks'?'Minhas tarefas':'Olá, Guilherme 👋'}</h1><p>Planeje sua semana, organize suas tarefas e mantenha o foco.</p></div><button className="primary-button header-create" onClick={()=>openNew()}>＋ Nova tarefa</button></header>
    {error&&<div className="error-banner" role="alert">{error}<button onClick={()=>setError('')} aria-label="Fechar erro">×</button></div>}
    <section className="stats-grid"><div className="stat-card"><span className="stat-icon purple">▣</span><span>Tarefas da semana</span><strong>{weekCount}</strong><small>Planejadas no calendário</small></div><div className="stat-card"><span className="stat-icon green">✓</span><span>Concluídas</span><strong>{completed}</strong><small>{percent}% do total</small></div><div className="stat-card"><span className="stat-icon pink">⌛</span><span>Pendentes</span><strong>{tasks.length-completed}</strong><small>Aguardando conclusão</small></div><div className="stat-card progress-stat"><span>Seu progresso</span><strong>{percent}%</strong><div className="progress-track"><div style={{width:`${percent}%`}}/></div><small>{completed} de {tasks.length} tarefas concluídas</small></div></section>
    {section==='calendar'&&<div className="workspace-grid"><section className="calendar-panel"><div className="calendar-toolbar"><div className="view-tabs">{(['day','week','month'] as View[]).map(v=><button key={v} className={view===v?'selected':''} onClick={()=>setView(v)}>{v==='day'?'Dia':v==='week'?'Semana':'Mês'}</button>)}</div><div className="period-nav"><button aria-label="Anterior" onClick={()=>navigate(-1)}>‹</button><strong>{label}</strong><button aria-label="Próximo" onClick={()=>navigate(1)}>›</button></div><button className="secondary-button" onClick={()=>setSelected(dateKey(new Date()))}>Hoje</button></div>
    {loading?<p className="loading">Carregando tarefas...</p>:view==='month'?<div className="month-grid">{weekdays.map(w=><div className="month-weekday" key={w}>{w}</div>)}{monthCells.map(d=>{const k=dateKey(d),items=visibleTasks.filter(t=>taskDate(t)===k);return <div className={`month-cell ${d.getMonth()!==selectedDate.getMonth()?'outside':''} ${k===selected?'selected-day':''}`} key={k}><button className="month-day-number" onClick={()=>{setSelected(k);setView('day')}}>{d.getDate()}</button>{items.slice(0,3).map(t=><button key={t.id} className={`month-event priority-${t.priority.toLowerCase()}`} onClick={()=>openEdit(t)}>{t.title}</button>)}{items.length>3&&<button className="more-events" onClick={()=>{setSelected(k);setView('day')}}>+{items.length-3} mais</button>}</div>})}</div>:<div className="time-calendar"><div className="time-head"><div className="time-corner"/>{(view==='day'?[selectedDate]:weekDays).map(d=><button key={dateKey(d)} className={`day-heading ${dateKey(d)===selected?'selected':''}`} onClick={()=>setSelected(dateKey(d))}><span>{weekdays[(d.getDay()+6)%7]}</span><strong>{pad(d.getDate())}</strong></button>)}</div><div className="time-body"><div className="time-labels">{hours.map(h=><div key={h}>{pad(h)}:00</div>)}</div><div className="day-columns" style={{gridTemplateColumns:`repeat(${view==='day'?1:7},minmax(0,1fr))`}}>{(view==='day'?[selectedDate]:weekDays).map(d=>{const key=dateKey(d);const items=visibleTasks.filter(t=>taskDate(t)===key);return <div className={`day-column ${key===selected?'selected-column':''}`} key={key}>
      {hours.map(h=><button type="button" className="hour-slot" key={h} title={`Criar tarefa ${pad(h)}:00`} onClick={()=>{setSelected(key);openNew(key,`${pad(h)}:00`)}} aria-label={`Criar tarefa em ${fmtDate(d,{day:'numeric',month:'long'})} às ${pad(h)} horas`}/>)}
      {items.map(t=>{const raw=t.startTime?Number(t.startTime.slice(0,2))*60+Number(t.startTime.slice(3,5)):6*60;const start=Math.max(0,Math.min(16*60,raw-6*60));const end=t.endTime?Number(t.endTime.slice(0,2))*60+Number(t.endTime.slice(3,5)):raw+60;const height=Math.max(36,Math.min((17*60-start),end-raw)*1.0);return <div className="positioned-event" key={t.id} style={{top:`${start}px`,height:`${height}px`}}>{calendarTask(t)}</div>})}</div>})}</div></div></div>}
    <div className="calendar-footnote">Clique em um horário para criar uma tarefa ou em um evento para editá-lo. Tarefas sem horário aparecem às 06h.</div></section>
    <aside className="right-rail"><div className="rail-card"><div className="rail-heading"><strong>{fmtDate(selectedDate,{month:'long',year:'numeric'})}</strong><div><button aria-label="Mês anterior" onClick={()=>setSelected(dateKey(new Date(selectedDate.getFullYear(),selectedDate.getMonth()-1,1)))}>‹</button><button aria-label="Próximo mês" onClick={()=>setSelected(dateKey(new Date(selectedDate.getFullYear(),selectedDate.getMonth()+1,1)))}>›</button></div></div><div className="mini-grid">{weekdays.map(w=><span key={w}>{w.slice(0,1)}</span>)}{Array.from({length:(monthFirst.getDay()+6)%7},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:new Date(selectedDate.getFullYear(),selectedDate.getMonth()+1,0).getDate()},(_,i)=>{const k=dateKey(new Date(selectedDate.getFullYear(),selectedDate.getMonth(),i+1));return <button key={k} className={`${k===selected?'selected':''} ${tasks.some(t=>taskDate(t)===k)?'has-task':''}`} onClick={()=>setSelected(k)}>{i+1}</button>})}</div></div><div className="rail-title"><h3>Agenda do dia</h3><span>{fmtDate(selectedDate,{weekday:'short',day:'numeric',month:'short'})}</span></div><div className="agenda-list">{selectedTasks.length?selectedTasks.map(t=>taskCard(t,true)):<div className="empty-note">Nenhuma tarefa neste dia.<button onClick={()=>openNew()}>＋ Adicionar tarefa</button></div>}</div><div className="rail-card"><div className="rail-heading"><strong>Progresso do dia</strong><span>{selectedTasks.filter(t=>t.completed).length} de {selectedTasks.length}</span></div><div className="progress-track"><div style={{width:`${selectedTasks.length?selectedTasks.filter(t=>t.completed).length/selectedTasks.length*100:0}%`}}/></div></div></aside></div>}
    {section!=='calendar'&&<section className="list-panel"><div className="list-header"><div><h2>{section==='dashboard'?'Visão geral das tarefas':'Todas as tarefas'}</h2><p>Pesquise, conclua ou edite suas atividades.</p></div><button className="primary-button" onClick={()=>openNew()}>＋ Nova tarefa</button></div><div className="list-controls"><input aria-label="Pesquisar tarefas" placeholder="⌕  Buscar por título ou descrição..." value={search} onChange={e=>setSearch(e.target.value)}/><div className="view-tabs">{(['all','pending','completed'] as const).map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f==='all'?'Todas':f==='pending'?'Pendentes':'Concluídas'}</button>)}</div></div>{loading?<p className="loading">Carregando...</p>:visibleTasks.length?visibleTasks.sort((a,b)=>taskDate(a).localeCompare(taskDate(b))).map(t=>taskCard(t)):<p className="empty-note">Nenhuma tarefa encontrada.</p>}</section>}
    </main>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)setModal(false)}}><div className="task-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><div><span className="eyebrow">PLANEJAMENTO</span><h2 id="modal-title">{editing?'Editar tarefa':'Nova tarefa'}</h2><p>Organize seus compromissos em poucos passos.</p></div><button className="close-button" aria-label="Fechar" onClick={()=>setModal(false)} disabled={saving}>×</button></div><form onSubmit={submitTask}><label>Título da tarefa *<input required autoFocus value={form.title} onChange={e=>changeForm('title',e.target.value)} placeholder="O que você precisa fazer?"/></label><label>Descrição<textarea rows={3} value={form.description} onChange={e=>changeForm('description',e.target.value)} placeholder="Adicione detalhes da atividade..."/></label><div className="form-fieldset"><span>Prioridade</span><div className="priority-options">{(['LOW','MEDIUM','HIGH'] as TaskPriority[]).map(p=><button type="button" key={p} className={`priority-option ${p.toLowerCase()} ${form.priority===p?'selected':''}`} onClick={()=>changeForm('priority',p)}>{priorityName[p]}</button>)}</div></div><label>Data planejada<input type="date" value={form.scheduledDate} onChange={e=>changeForm('scheduledDate',e.target.value)}/></label><div className="form-two"><label>Hora de início<input type="time" value={form.startTime} onChange={e=>changeForm('startTime',e.target.value)}/></label><label>Hora de término<input type="time" value={form.endTime} onChange={e=>changeForm('endTime',e.target.value)}/></label></div>{error&&<p className="form-error">{error}</p>}<div className="modal-actions">{editing&&<button type="button" className="danger-button" disabled={saving||busyId!==null} onClick={()=>removeTask(editing)}>Excluir</button>}<button type="button" className="secondary-button" disabled={saving} onClick={()=>setModal(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving?'Salvando...':editing?'Salvar alterações':'✓ Criar tarefa'}</button></div></form></div></div>}
  </div>
}
export default App
