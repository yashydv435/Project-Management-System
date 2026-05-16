'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight, Activity } from 'lucide-react';

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', padding: '2rem 0' }}>
      <Activity size={16} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.875rem' }}>Loading...</span>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const todoCount = tasks.filter(t => t.status === 'Todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'InProgress').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;
  const totalTasks = tasks.length;

  const overdueTasks = tasks.filter(t =>
    t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < new Date()
  );

  const stats = [
    { label: 'To Do', count: todoCount, icon: AlertCircle, color: 'var(--text-muted)', bg: 'rgba(161, 161, 170, 0.08)' },
    { label: 'In Progress', count: inProgressCount, icon: Clock, color: 'var(--accent)', bg: 'var(--accent-dim)' },
    { label: 'Completed', count: doneCount, icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-dim)' },
  ];

  const tasksByUser = Object.values(tasks.reduce((acc: any, task: any) => {
    const userName = task.assignedTo?.name || 'Unassigned';
    if (!acc[userName]) acc[userName] = { name: userName, count: 0, done: 0 };
    acc[userName].count++;
    if (task.status === 'Done') acc[userName].done++;
    return acc;
  }, {})).sort((a: any, b: any) => b.count - a.count);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Overview of your projects and tasks.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-cards" style={{ marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.625rem', background: stat.bg, borderRadius: 'var(--radius)', color: stat.color, display: 'flex' }}>
              <stat.icon size={18} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.125rem' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>{stat.count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Overall Progress</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {doneCount} / {totalTasks} completed
            </span>
          </div>
          <div style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(doneCount / totalTasks) * 100}%`,
              background: 'var(--accent)',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <AlertCircle size={14} /> Overdue
          </h2>
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overdueTasks.map(task => (
                  <tr key={task.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text)' }}>{task.title}</td>
                    <td>{task.project.name}</td>
                    <td style={{ color: 'var(--danger)' }}>{format(new Date(task.dueDate), 'MMM d, yyyy')}</td>
                    <td>
                      <span className={`badge`} style={{ 
                        background: task.priority === 'High' ? 'var(--danger-dim)' : 'var(--bg-hover)', 
                        color: task.priority === 'High' ? 'var(--danger)' : 'var(--text-muted)' 
                      }}>
                        {task.priority || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${task.status.toLowerCase()}`}>
                        {task.status === 'InProgress' ? 'In Progress' : task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 500 }}>Recent Tasks</h2>
          {tasks.length > 5 && (
            <a href="/dashboard/tasks" style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ArrowUpRight size={12} />
            </a>
          )}
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
              {tasks.slice(0, 5).map(task => (
                <tr key={task.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text)' }}>{task.title}</td>
                  <td>{task.project?.name}</td>
                  <td>{task.assignedTo?.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>
                    <span className={`badge`} style={{ 
                      background: task.priority === 'High' ? 'var(--danger-dim)' : 'var(--bg-hover)', 
                      color: task.priority === 'High' ? 'var(--danger)' : 'var(--text-muted)' 
                    }}>
                      {task.priority || 'Medium'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${task.status.toLowerCase()}`}>
                      {task.status === 'InProgress' ? 'In Progress' : task.status}
                    </span>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem' }}>
                    No tasks yet. Create a project and add tasks to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tasks Per User */}
      {tasksByUser.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>Tasks per User</h2>
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Total Assigned Tasks</th>
                  <th>Completed</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {(tasksByUser as any[]).map((u, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, color: 'var(--text)' }}>{u.name}</td>
                    <td>{u.count}</td>
                    <td>{u.done}</td>
                    <td style={{ width: '40%' }}>
                      <div style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden', width: '100%' }}>
                        <div style={{
                          height: '100%',
                          width: `${(u.done / u.count) * 100}%`,
                          background: 'var(--accent)',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
