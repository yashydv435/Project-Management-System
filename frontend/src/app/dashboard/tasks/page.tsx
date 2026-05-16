'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckSquare, Activity, Search, Filter, X } from 'lucide-react';
import Link from 'next/link';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(res => res.json()),
      fetch('/api/tasks').then(res => res.json()),
      fetch('/api/projects').then(res => res.json())
    ]).then(([userData, tasksData, projectsData]) => {
      setUser(userData.user);
      setTasks(tasksData);
      setFilteredTasks(tasksData);
      setProjects(projectsData);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = tasks;

    if (search) {
      result = result.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    }

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    if (projectFilter !== 'all') {
      result = result.filter(t => t.projectId === projectFilter);
    }

    setFilteredTasks(result);
  }, [search, statusFilter, projectFilter, tasks]);

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const updatedTasks = await fetch('/api/tasks').then(res => res.json());
    setTasks(updatedTasks);
  };

  const handleUpdateTaskPriority = async (taskId: string, priority: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority })
    });
    const updatedTasks = await fetch('/api/tasks').then(res => res.json());
    setTasks(updatedTasks);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setProjectFilter('all');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', padding: '2rem 0' }}>
      <Activity size={16} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.875rem' }}>Loading...</span>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Tasks</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {user?.role === 'Admin' ? 'All tasks across projects.' : 'Your assigned tasks.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', fontSize: '0.75rem' }}>
          <span className="badge badge-todo" style={{ padding: '0.25rem 0.625rem' }}>
            {tasks.filter(t => t.status === 'Todo').length} Todo
          </span>
          <span className="badge badge-inprogress" style={{ padding: '0.25rem 0.625rem' }}>
            {tasks.filter(t => t.status === 'InProgress').length} Active
          </span>
          <span className="badge badge-done" style={{ padding: '0.25rem 0.625rem' }}>
            {tasks.filter(t => t.status === 'Done').length} Done
          </span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search tasks..."
            style={{ paddingLeft: '2.25rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select 
              className="input-field" 
              style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Todo">To Do</option>
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <select 
            className="input-field" 
            style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {(search || statusFilter !== 'all' || projectFilter !== 'all') && (
            <button 
              onClick={clearFilters}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', padding: '0.5rem' }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map(task => (
              <tr key={task.id}>
                <td style={{ fontWeight: 500, color: 'var(--text)' }}>{task.title}</td>
                <td>
                  <Link href={`/dashboard/projects/${task.project.id}`} style={{ color: 'var(--accent)', fontWeight: 500, fontSize: '0.8125rem' }}>
                    {task.project.name}
                  </Link>
                </td>
                <td>{task.assignedTo?.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td>{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td>
                  <select
                    className="input-field"
                    style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)' }}
                    value={task.priority || 'Medium'}
                    onChange={(e) => handleUpdateTaskPriority(task.id, e.target.value)}
                    disabled={user.role !== 'Admin'}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </td>
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
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
                  <CheckSquare size={28} style={{ opacity: 0.3, margin: '0 auto 0.5rem', display: 'block' }} />
                  <p style={{ fontSize: '0.875rem' }}>No tasks found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
