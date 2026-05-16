# 🌌 Aura | Project Management

A clean, minimal, and high-clarity project management system designed for focused teams. Aura strips away the complexity of traditional PM tools, offering a professional dark-mode experience that prioritizes information density and visual excellence.

## ✨ Features

- **🎯 Intelligent Dashboard**: Overview of your active tasks, project progress, overdue items, and a dedicated 'Tasks per User' progress widget.
- **📁 Project Organization**: Create and manage projects with ease. Admin-only creation controls.
- **✅ Advanced Task Management**: 
  - Inline status updates (To Do, In Progress, Done).
  - Task Priority assignment (High, Medium, Low) with color-coded badges.
  - Multi-user assignment (Specific user or "All Members" at once).
  - Robust filtering by search, status, and project.
- **👥 Team Insights & Member Management**: 
  - A dedicated Members tab to track team size and task distribution across the organization.
  - **Admin controls**: Admins can directly add new team members or remove them from the system.
- **🔐 Secure Auth**: Role-based access control (Admin vs. Member) with a beautiful dynamic login/signup experience.
- **🎨 Premium Design**: Monochrome aesthetic, Inter typography, and smooth micro-animations.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, Lucide Icons, Vanilla CSS.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL (using `pg` driver with custom automatic table initialization).
- **Authentication**: JWT with cookie-based persistence.
- **Deployment**: Fully configured for Railway.app (Dual-service architecture).

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or remote)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashydv435/Project-Management-System.git
   cd Project-Management-System
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   # Create a .env file and add your DATABASE_URL, PORT=5000, and JWT_SECRET
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   # Create a .env.local file and add BACKEND_URL=http://localhost:5000
   npm run dev
   ```

4. **Access the app**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 License
This project is licensed under the MIT License.
