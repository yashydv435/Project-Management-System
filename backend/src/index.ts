import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
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
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'Admin' ? 'Admin' : 'Member';
    const user = await prisma.user.create({ data: { name, email, password: hashedPassword, role: userRole } });
    
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.cookie('auth_token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, path: '/' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// --- USER ROUTES ---
app.get('/api/users', authenticate, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true,
      _count: { select: { tasks: true } }
    },
    orderBy: { name: 'asc' }
  });
  res.json(users);
});

// --- PROJECT ROUTES ---
app.get('/api/projects', authenticate, async (req, res) => {
  const projects = await prisma.project.findMany({
    include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { tasks: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(projects);
});

app.post('/api/projects', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Admin') return res.status(403).json({ error: 'Only admins can create projects' });
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const project = await prisma.project.create({ data: { name, description, ownerId: user.id } });
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/projects/:id', authenticate, async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id as string },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tasks: { include: { assignedTo: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' } }
    }
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    await prisma.task.deleteMany({ where: { projectId: req.params.id as string } });
    await prisma.project.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

// --- TASK ROUTES ---
app.get('/api/tasks', authenticate, async (req, res) => {
  const user = (req as any).user;
  const tasks = await prisma.task.findMany({
    where: user.role === 'Admin' ? {} : { assignedToId: user.id },
    include: { project: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tasks);
});

app.post('/api/tasks', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Admin') return res.status(403).json({ error: 'Only admins can create tasks' });
  try {
    const { title, description, projectId, assignedToId, dueDate } = req.body;
    if (!title || !projectId) return res.status(400).json({ error: 'Title and projectId are required' });
    
    if (assignedToId === 'all') {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      const tasks = await Promise.all(allUsers.map(u => 
        prisma.task.create({
          data: { title, description, projectId, assignedToId: u.id, dueDate: dueDate ? new Date(dueDate) : null }
        })
      ));
      return res.status(201).json(tasks);
    }
    
    const task = await prisma.task.create({
      data: { title, description, projectId, assignedToId: assignedToId || null, dueDate: dueDate ? new Date(dueDate) : null }
    });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.patch('/api/tasks/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  try {
    const { status, title, description, assignedToId, dueDate } = req.body;
    const task = await prisma.task.findUnique({ where: { id: req.params.id as string } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    if (user.role !== 'Admin' && task.assignedToId !== user.id) return res.status(403).json({ error: 'Unauthorized' });
    
    const updatedData: any = {};
    if (status !== undefined) updatedData.status = status;
    if (user.role === 'Admin') {
      if (title !== undefined) updatedData.title = title;
      if (description !== undefined) updatedData.description = description;
      if (assignedToId !== undefined) updatedData.assignedToId = assignedToId;
      if (dueDate !== undefined && dueDate !== null) updatedData.dueDate = new Date(dueDate);
    }
    
    const updatedTask = await prisma.task.update({ where: { id: req.params.id as string }, data: updatedData });
    res.json(updatedTask);
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    await prisma.task.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Internal server error' }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
