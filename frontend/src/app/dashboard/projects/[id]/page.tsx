'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Trash2, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      setProject(await res.json());
    } else {
      router.push('/dashboard/projects');
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(res => res.json()),
      fetch('/api/users').then(res => res.json()),
      fetchProject()
    ]).then(([userData, usersData]) => {
      setUser(userData.user);
      setUsers(usersData);
      setLoading(false);
    });
  }, [id]);

  const handleDeleteProject = async () => {
    if (confirm('Are you sure you want to delete this project? All tasks will be deleted.')) {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      router.push('/dashboard/projects');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        description, 
        projectId: id, 
        assignedToId: assignedToId || undefined, 
        dueDate: dueDate || undefined 
      })
    });
    
    if (res.ok) {
      await fetchProject();
      setShowTaskModal(false);
      setTitle('');
      setDescription('');
      setAssignedToId('');
      setDueDate('');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchProject();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Delete this task?')) {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchProject();
    }
  };

  if (loading || !project) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', padding: '2rem 0' }}>
      <Activity size={16} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.875rem' }}>Loading...</span>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const todoCount = project.tasks.filter((t: any) => t.status === 'Todo').length;
  const inProgressCount = project.tasks.filter((t: any) => t.status === 'InProgress').length;
  const doneCount = project.tasks.filter((t: any) => t.status === 'Done').length;

  return (
    <div className="animate-fade-in">
      {/* Back Link */}
      <Link href="/dashboard/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem', transition: 'color 150ms' }}>
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      {/* Project Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{project.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{project.description || 'No description.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user?.role === 'Admin' && (
            <>
              <button onClick={handleDeleteProject} className="btn btn-danger">
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span className="badge badge-todo" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>
          {todoCount} Todo
        </span>
        <span className="badge badge-inprogress" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>
          {inProgressCount} In Progress
        </span>
        <span className="badge badge-done" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>
          {doneCount} Done
        </span>
      </div>

      {/* Tasks Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tasks</h2>
        {user?.role === 'Admin' && (
          <button onClick={() => setShowTaskModal(true)} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
            <Plus size={14} /> Add Task
          </button>
        )}
      </div>

      {/* Tasks Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Status</th>
              {user?.role === 'Admin' && <th style={{ width: '48px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {project.tasks.map((task: any) => (
              <tr key={task.id}>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--text)' }}>{task.title}</div>
                  {task.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{task.description}</div>}
                </td>
                <td>{task.assignedTo?.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td>{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td>
                  <select 
                    className="input-field" 
                    style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)' }}
                    value={task.status}
                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                    disabled={user.role !== 'Admin' && task.assignedToId !== user.id}
                  >
                    <option value="Todo">To Do</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </td>
                {user?.role === 'Admin' && (
                  <td>
                    <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px', transition: 'color 150ms' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {project.tasks.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'Admin' ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem', fontSize: '0.8125rem' }}>
                  No tasks in this project yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="label">Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Task name"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Optional description..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="label">Assign To</label>
                <select className="input-field" value={assignedToId} onChange={e => setAssignedToId(e.target.value)}>
                  <option value="">Unassigned</option>
                  <option value="all">All Members</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Due Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
