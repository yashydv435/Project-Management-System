# 🌌 Aura | Project Management

A clean, minimal, and high-clarity project management system designed for focused teams. Aura strips away the complexity of traditional PM tools, offering a professional dark-mode experience that prioritizes information density and visual excellence.

![Auth Page Preview](https://github.com/yashydv435/Project-Management-System/raw/main/frontend/public/auth-bg.png)

## ✨ Features

- **🎯 Intelligent Dashboard**: Overview of your active tasks, project progress, and overdue items with visual bars and stats.
- **📁 Project Organization**: Create and manage projects with ease. Admin-only creation controls.
- **✅ Advanced Task Management**: 
  - Inline status updates.
  - Multi-user assignment (Specific user or "All Members" at once).
  - Robust filtering by search, status, and project.
- **👥 Team Insights**: A dedicated Members tab to track team size and task distribution across the organization.
- **🔐 Secure Auth**: Role-based access control (Admin vs. Member) with a beautiful dynamic login/signup experience.
- **🎨 Premium Design**: Monochrome aesthetic, Inter typography, and smooth micro-animations.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, Lucide Icons, Vanilla CSS.
- **Backend**: Node.js, Express.
- **Database**: Prisma with SQLite (can be easily migrated to PostgreSQL/MongoDB).
- **Authentication**: JWT with cookie-based persistence.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

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
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the app**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 License
This project is licensed under the MIT License.
