'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, User, AlertTriangle, Layout, FolderKanban, CheckSquare, Users } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formHeight, setFormHeight] = useState<number | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Measure form height for smooth transition
  useEffect(() => {
    if (formRef.current) {
      setFormHeight(formRef.current.scrollHeight);
    }
  }, [isLogin]);

  const handleSwitch = () => {
    setError('');
    setIsLogin(!isLogin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin ? { email, password } : { name, email, password, role };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const features = [
    { icon: FolderKanban, title: 'Organize Projects', desc: 'Create and manage projects with your team in one place.' },
    { icon: CheckSquare, title: 'Track Tasks', desc: 'Assign tasks, set deadlines, and monitor progress easily.' },
    { icon: Users, title: 'Team Collaboration', desc: 'Invite members, assign roles, and work together seamlessly.' },
  ];

  return (
    <div className={`auth-wrapper ${isLoaded ? 'loaded' : ''}`}>
      {/* Left Side — Features */}
      <div className="auth-graphic-side">
        <div className="auth-graphic-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layout size={18} color="white" />
            </div>
            <span style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Aura</span>
          </div>

          <h2 className="auth-graphic-title">
            {isLogin ? (
              <>Manage your<br />projects with<br />clarity.</>
            ) : (
              <>Get started<br />in just a few<br />seconds.</>
            )}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: 1.7, maxWidth: '400px', marginBottom: '2.5rem' }}>
            {isLogin
              ? 'A simple tool to keep your team aligned — track tasks, manage projects, and stay on top of deadlines.'
              : 'Create your free account and start organizing your work right away. No credit card required.'}
          </p>

          <div className="feature-list">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="feature-item"
                style={{ animationDelay: `${i * 100 + 200}ms` }}
              >
                <div className="feature-icon">
                  <feature.icon size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text)', marginBottom: '0.125rem' }}>
                    {feature.title}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {feature.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="brand-logo">
            <div className="logo-icon">
              <Layout size={20} color="white" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Aura</span>
          </div>

          <div className="auth-header" key={isLogin ? 'login-header' : 'signup-header'}>
            <h1 className="auth-title">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <p className="auth-subtitle">
              {isLogin ? 'Enter your credentials to continue.' : 'Fill in the details below to get started.'}
            </p>
          </div>

          {error && (
            <div className="error-banner">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="form-transition-wrapper" style={{ height: formHeight ? `${formHeight}px` : 'auto' }}>
            <form onSubmit={handleSubmit} ref={formRef} key={isLogin ? 'login' : 'signup'} className="auth-form-animated">

              {!isLogin && (
                <div className="input-group field-animate" style={{ animationDelay: '0ms' }}>
                  <label className="label">Full Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={16} />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="input-group field-animate" style={{ animationDelay: isLogin ? '0ms' : '50ms' }}>
                <label className="label">Email</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={16} />
                  <input
                    type="email"
                    className="input-field"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group field-animate" style={{ animationDelay: isLogin ? '50ms' : '100ms' }}>
                <label className="label">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={16} />
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="input-group field-animate" style={{ animationDelay: '150ms' }}>
                  <label className="label">Role</label>
                  <div className="input-wrapper">
                    <select
                      className="input-field"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Member">Team Member</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn-submit field-animate"
                style={{ animationDelay: isLogin ? '100ms' : '200ms' }}
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner" />
                    Processing...
                  </span>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="auth-footer">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="switch-btn"
              onClick={handleSwitch}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        .auth-wrapper { opacity: 0; transition: opacity 0.5s ease; }
        .auth-wrapper.loaded { opacity: 1; }
      `}</style>
    </div>
  );
}
