'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Folder, ArrowRight, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(res => res.json()),
      fetch('/api/projects').then(res => res.json())
    ]).then(([userData, projectsData]) => {
      setUser(userData.user);
      setProjects(projectsData);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    
    if (res.ok) {
      const updated = await fetch('/api/projects').then(res => res.json());
      setProjects(updated);
      setShowModal(false);
      setName('');
      setDescription('');
    }
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
          <h1 style={{ fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Projects</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage and organize your team's projects.</p>
        </div>
        
        {user?.role === 'Admin' && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      <div className="grid-cards">
        {projects.map(project => (
          <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
            <div className="card glass-panel" style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', display: 'flex' }}>
                  <Folder size={16} />
                </div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{project.name}</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', flex: 1, marginBottom: '1rem', lineHeight: 1.5 }}>
                {project.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {format(new Date(project.createdAt), 'MMM d')}
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Folder size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.375rem' }}>No projects yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Create your first project to get started.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>New Project</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="label">Project Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Marketing Website"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Optional project description..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
