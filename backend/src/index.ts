import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { pool, initDB } from './lib/db';
import { signToken, verifyToken } from './lib/auth';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get('/', (req, res) => res.send('Backend is running'));

// Auth Middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });
  (req as any).user = decoded;
  next();
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'Admin' ? 'Admin' : 'Member';

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, userRole]
    );
    const user = result.rows[0];

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.cookie('auth_token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, path: '/' });
    res.json({ user });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.cookie('auth_token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, path: '/' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  res.json({ success: true });
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  const userId = (req as any).user.id;
  const result = await pool.query(
    'SELECT id, name, email, role FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ user: result.rows[0] });
});

// --- USER ROUTES ---

app.get('/api/users', authenticate, async (req, res) => {
  const result = await pool.query(`
    SELECT u.id, u.name, u.email, u.role,
           COUNT(t.id)::int AS task_count
    FROM users u
    LEFT JOIN tasks t ON t.assigned_to_id = u.id
    GROUP BY u.id
    ORDER BY u.name ASC
  `);
  const users = result.rows.map(u => ({
    id: u.id, name: u.name, email: u.email, role: u.role,
    _count: { tasks: u.task_count }
  }));
  res.json(users);
});

// --- PROJECT ROUTES ---

app.get('/api/projects', authenticate, async (req, res) => {
  const result = await pool.query(`
    SELECT
      p.id, p.name, p.description, p.owner_id, p.created_at, p.updated_at,
      u.id AS u_id, u.name AS u_name, u.email AS u_email,
      COUNT(t.id)::int AS task_count
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id, u.id
    ORDER BY p.created_at DESC
  `);
  const projects = result.rows.map(p => ({
    id: p.id, name: p.name, description: p.description,
    ownerId: p.owner_id, createdAt: p.created_at, updatedAt: p.updated_at,
    owner: { id: p.u_id, name: p.u_name, email: p.u_email },
    _count: { tasks: p.task_count }
  }));
  res.json(projects);
});

app.post('/api/projects', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Admin') return res.status(403).json({ error: 'Only admins can create projects' });
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/projects/:id', authenticate, async (req, res) => {
  const projectRes = await pool.query(`
    SELECT
      p.id, p.name, p.description, p.owner_id, p.created_at, p.updated_at,
      u.id AS u_id, u.name AS u_name, u.email AS u_email
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = $1
  `, [req.params.id]);

  if (projectRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
  const p = projectRes.rows[0];

  const tasksRes = await pool.query(`
    SELECT
      t.id, t.title, t.description, t.status, t.project_id, t.priority,
      t.assigned_to_id, t.due_date, t.created_at, t.updated_at,
      u.id AS assignee_id, u.name AS assignee_name, u.email AS assignee_email
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to_id = u.id
    WHERE t.project_id = $1
    ORDER BY t.created_at DESC
  `, [req.params.id]);

  res.json({
    id: p.id, name: p.name, description: p.description,
    ownerId: p.owner_id, createdAt: p.created_at, updatedAt: p.updated_at,
    owner: { id: p.u_id, name: p.u_name, email: p.u_email },
    tasks: tasksRes.rows.map(t => ({
      id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
      projectId: t.project_id, assignedToId: t.assigned_to_id,
      dueDate: t.due_date, createdAt: t.created_at, updatedAt: t.updated_at,
      assignedTo: t.assignee_id ? { id: t.assignee_id, name: t.assignee_name, email: t.assignee_email } : null
    }))
  });
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    await pool.query('DELETE FROM tasks WHERE project_id = $1', [req.params.id]);
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// --- TASK ROUTES ---

app.get('/api/tasks', authenticate, async (req, res) => {
  const user = (req as any).user;
  const whereClause = user.role === 'Admin' ? '' : 'WHERE t.assigned_to_id = $1';
  const params = user.role === 'Admin' ? [] : [user.id];

  const result = await pool.query(`
    SELECT
      t.id, t.title, t.description, t.status, t.project_id, t.priority,
      t.assigned_to_id, t.due_date, t.created_at, t.updated_at,
      p.id AS p_id, p.name AS p_name,
      u.id AS u_id, u.name AS u_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assigned_to_id = u.id
    ${whereClause}
    ORDER BY t.created_at DESC
  `, params);

  const tasks = result.rows.map(t => ({
    id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
    projectId: t.project_id, assignedToId: t.assigned_to_id,
    dueDate: t.due_date, createdAt: t.created_at, updatedAt: t.updated_at,
    project: { id: t.p_id, name: t.p_name },
    assignedTo: t.u_id ? { id: t.u_id, name: t.u_name } : null
  }));
  res.json(tasks);
});

app.post('/api/tasks', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Admin') return res.status(403).json({ error: 'Only admins can create tasks' });
  try {
    const { title, description, projectId, assignedToId, dueDate, priority } = req.body;
    if (!title || !projectId) return res.status(400).json({ error: 'Title and projectId are required' });

    if (assignedToId === 'all') {
      const allUsers = await pool.query('SELECT id FROM users');
      const tasks = await Promise.all(allUsers.rows.map(u =>
        pool.query(
          'INSERT INTO tasks (title, description, project_id, assigned_to_id, due_date, priority) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [title, description || null, projectId, u.id, dueDate ? new Date(dueDate) : null, priority || 'Medium']
        ).then(r => r.rows[0])
      ));
      return res.status(201).json(tasks);
    }

    const result = await pool.query(
      'INSERT INTO tasks (title, description, project_id, assigned_to_id, due_date, priority) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description || null, projectId, assignedToId || null, dueDate ? new Date(dueDate) : null, priority || 'Medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.patch('/api/tasks/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  try {
    const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (taskRes.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const task = taskRes.rows[0];

    if (user.role !== 'Admin' && task.assigned_to_id !== user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    const { status, title, description, assignedToId, dueDate, priority } = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }
    if (user.role === 'Admin') {
      if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
      if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
      if (assignedToId !== undefined) { fields.push(`assigned_to_id = $${idx++}`); values.push(assignedToId); }
      if (dueDate !== undefined && dueDate !== null) { fields.push(`due_date = $${idx++}`); values.push(new Date(dueDate)); }
      if (priority !== undefined) { fields.push(`priority = $${idx++}`); values.push(priority); }
    }

    if (fields.length === 0) return res.json(task);
    fields.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// Start server after DB is ready
const PORT = process.env.PORT || 5000;
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
