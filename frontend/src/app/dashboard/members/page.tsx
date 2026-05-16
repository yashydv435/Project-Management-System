'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Shield, CheckCircle2, Activity, Plus, Trash2 } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Member');
  const [error, setError] = useState('');

  const fetchMembers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) setMembers(await res.json());
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(res => res.json()),
      fetchMembers()
    ]).then(([userData]) => {
      setUser(userData.user);
      setLoading(false);
    });
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    
    if (res.ok) {
      setShowModal(false);
      setName(''); setEmail(''); setPassword(''); setRole('Member');
      fetchMembers();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add member');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('Are you sure you want to remove this member? Their tasks will become unassigned.')) {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchMembers();
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
          <h1 style={{ fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Team Members</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>View and manage your project team.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color="var(--accent)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{members.length}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Members</span>
          </div>
          {user?.role === 'Admin' && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={16} /> Add Member
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Tasks Assigned</th>
              <th>Status</th>
              {user?.role === 'Admin' && <th style={{ width: '48px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, fontSize: '0.8125rem'
                    }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{member.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Mail size={10} /> {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
                    <Shield size={12} color={member.role === 'Admin' ? 'var(--accent)' : 'var(--text-muted)'} />
                    {member.role}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={14} color="var(--success)" />
                    <span style={{ fontWeight: 500 }}>{member._count.tasks}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks</span>
                  </div>
                </td>
                <td>
                  <span className="badge badge-done" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80' }}>
                    Active
                  </span>
                </td>
                {user?.role === 'Admin' && (
                  <td>
                    {user.id !== member.id && (
                      <button onClick={() => handleDeleteMember(member.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px', transition: 'color 150ms' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'Admin' ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>Add Team Member</h2>
            {error && (
              <div style={{ padding: '0.75rem', background: 'var(--danger-dim)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Email Address</label>
                <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Temporary Password</label>
                <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Role</label>
                <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Member">Team Member</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
