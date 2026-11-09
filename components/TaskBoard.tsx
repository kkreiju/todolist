'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpRight, Check, CheckCheck, Circle, Clock3, ImagePlus, LoaderCircle, Plus, Search, Sparkles, X, Zap } from 'lucide-react';
import { createTask, deleteTask, listTasks, setTaskCompleted, Task, updateTask } from '@/services/taskService';

type Filter = 'all' | 'active' | 'completed';
const relativeTime = (value: unknown) => {
  const date = value && typeof value === 'object' && 'toDate' in value ? (value as { toDate: () => Date }).toDate() : null;
  if (!date) return 'Just added';
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Task | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setTasks(await listTasks()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load your tasks.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { if (modal) titleRef.current?.focus(); }, [modal]);

  const counts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
  }), [tasks]);
  const visible = tasks.filter((task) => (filter === 'all' || (filter === 'active' ? !task.completed : task.completed))
    && `${task.title} ${task.details}`.toLowerCase().includes(search.toLowerCase()));

  function openForm(task: Task | null = null) {
    setTitle(task?.title ?? ''); setDetails(task?.details ?? ''); setFile(null); setRemoveImage(false);
    setError(''); setIsDirty(false); setModal(task ?? 'new');
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError('Give this task a title first.'); titleRef.current?.focus(); return; }
    setBusy(true); setError('');
    try {
      if (modal && modal !== 'new') await updateTask(modal, { title, details }, file, removeImage);
      else await createTask({ title, details }, file);
      setNotice(modal === 'new' ? 'Task added to your list.' : 'Your changes are saved.');
      setIsDirty(false);
      setModal(null); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }
  async function toggle(task: Task) {
    setBusy(true); setError('');
    try { await setTaskCompleted(task, !task.completed); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update task.'); }
    finally { setBusy(false); }
  }
  async function remove(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This can’t be undone.`)) return;
    setBusy(true); setError('');
    try { await deleteTask(task); setNotice('Task deleted.'); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not delete task.'); }
    finally { setBusy(false); }
  }

  return <main className="app-shell">
    <aside className="rail" aria-label="Daymark"><a href="#home" className="brand-mark" aria-label="Daymark home"><span className="brand-geometry" aria-hidden="true"/></a><div className="rail-line"/><span className="rail-caption">YOUR SPACE</span><div className="rail-active"><Circle size={16}/></div><span className="rail-bottom">D</span></aside>
    <section className="workspace" id="home">
      <header className="topbar"><a className="wordmark" href="#home"><span className="wordmark-icon"><Zap size={17}/></span> daymark</a><div className="topbar-right"><span className="shared-label"><span className="live-dot"/> Shared board</span><span className="avatar" aria-label="Guest profile">G</span></div></header>
      <div className="board-wrap">
        <div className="intro"><div className="eyebrow"><Sparkles size={13}/> A LITTLE SPACE TO THINK</div><h1>Make room for<br/><span>what matters.</span></h1><p className="intro-copy">A place to collect the little things and the big things.<br className="desktop-break"/> One thoughtful step at a time.</p>
          <div className="summary-row"><div className="summary-icon"><CheckCheck size={17}/></div><div><strong>{counts.active}</strong><span> {counts.active === 1 ? 'thing' : 'things'} to do</span><span className="summary-divider">·</span><span>{counts.completed} done</span></div></div>
        </div>
        <section className="tasks-section" aria-label="Task board">
          <div className="section-heading"><div><span className="section-kicker">YOUR BOARD</span><h2>Today, in focus<span className="heading-period">.</span></h2></div><button className="add-button" onClick={() => openForm()}><Plus size={17}/> <span>New task</span></button></div>
          <div className="toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter tasks">{(['all','active','completed'] as Filter[]).map((item) => <button key={item} role="tab" aria-selected={filter === item} className={`filter-tab ${filter === item ? 'selected' : ''}`} onClick={() => setFilter(item)}>{item[0].toUpperCase()+item.slice(1)}<span className="filter-count">{counts[item]}</span></button>)}</div><label className="search-box"><Search size={15}/><span className="sr-only">Search tasks</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a task"/></label></div>
          {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={14}/></button></div>}
          {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
          {loading ? <div className="loading-state"><LoaderCircle className="spin" size={22}/><span>Gathering your thoughts…</span></div> : visible.length ? <div className="task-grid">{visible.map((task, index) => <article key={task.id} className={`task-card ${task.completed ? 'is-complete' : ''} ${task.imageUrl ? 'has-image' : ''}`} style={task.imageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(8, 17, 18, .2), rgba(8, 17, 18, .9)), url("${task.imageUrl}")`, animationDelay: `${index * 55}ms` } : { animationDelay: `${index * 55}ms` }}>
            <div className="card-top"><span className="task-date"><Clock3 size={12}/>{relativeTime(task.createdAt)}</span><button className="more-button" onClick={() => openForm(task)} aria-label={`Edit ${task.title}`}><ArrowUpRight size={15}/></button></div>
            <div className="card-content"><button className={`complete-button ${task.completed ? 'checked' : ''}`} onClick={() => void toggle(task)} disabled={busy} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}>{task.completed && <Check size={13}/>}</button><div className="task-copy"><h3>{task.title}</h3>{task.details && <p>{task.details}</p>}</div></div>
            <div className="card-footer"><span className={`status-pill ${task.completed ? 'done' : ''}`}><span/>{task.completed ? 'Completed' : 'In progress'}</span><button className="delete-button" onClick={() => void remove(task)} aria-label={`Delete ${task.title}`}><span>Delete</span><X size={14}/></button></div>
          </article>)}</div> : <div className="empty-state"><div className="empty-illustration" aria-hidden="true"><span className="empty-sun"/><span className="empty-line line-one"/><span className="empty-line line-two"/><span className="empty-check"><Check size={13}/></span></div><h3>{search ? 'Nothing found just yet.' : filter === 'completed' ? 'A clean slate.' : 'A little room to begin.'}</h3><p>{search ? 'Try a different word or phrase.' : filter === 'completed' ? 'Finished tasks will find their way here.' : 'Start with one thing that’s on your mind.'}</p>{!search && filter !== 'completed' && <button className="empty-add" onClick={() => openForm()}><Plus size={15}/> Add your first task</button>}</div>}
          <div className="list-foot"><span><ArrowDownWideNarrow size={13}/> Recent first</span><span>{counts.all} {counts.all === 1 ? 'task' : 'tasks'} on your board</span></div>
        </section>
         <footer className="footer-note"><span>Small steps still move you forward.</span><span className="footer-geometry" aria-hidden="true"/></footer>
      </div>
    </section>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy && !isDirty) setModal(null); }}><section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><span className="section-kicker">A FRESH THOUGHT</span><h2 id="modal-title">{modal === 'new' ? 'Add to your board' : 'A small edit'}</h2></div><button className="modal-close" onClick={() => setModal(null)} disabled={busy} aria-label="Close form"><X size={18}/></button></div><form onSubmit={submit}><label className="form-label" htmlFor="task-title">Task title <span>REQUIRED</span></label><input ref={titleRef} id="task-title" className="form-input" value={title} onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }} maxLength={100} placeholder="What’s on your mind?" required/><label className="form-label details-label" htmlFor="task-details">A few details <span>OPTIONAL</span></label><textarea id="task-details" className="form-input form-textarea" value={details} onChange={(e) => { setDetails(e.target.value); setIsDirty(true); }} maxLength={1000} placeholder="Add a note to future you…" rows={3}/><div className="form-label image-label"><span>BACKGROUND IMAGE</span><span>OPTIONAL · 5 MB MAX</span></div>{(file || (modal !== 'new' && modal.imageUrl && !removeImage)) ? <div className="file-preview">{file ? <span>{file.name}</span> : <span>Current image attached</span>}<button type="button" onClick={() => file ? (setFile(null), fileRef.current && (fileRef.current.value = ''), setIsDirty(true)) : (setRemoveImage(true), setIsDirty(true))} aria-label="Remove background image"><X size={15}/></button></div> : <button type="button" className="upload-button" onClick={() => fileRef.current?.click()}><ImagePlus size={17}/><span>Choose an image</span><span className="upload-hint">JPG, PNG, WebP, GIF</span></button>}<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => { const selected = e.target.files?.[0]; if (selected) { setFile(selected); setRemoveImage(false); setIsDirty(true); } }}/>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button type="submit" className="save-button" disabled={busy}>{busy ? <><LoaderCircle size={16} className="spin"/> Saving…</> : <><Check size={16}/>{modal === 'new' ? 'Add task' : 'Save changes'}</>}</button></div></form></section></div>}
  </main>;
}
