<div align="center">

<img src="https://img.shields.io/badge/Flowspace-Project%20Management-6c63ff?style=for-the-badge&logoColor=white" alt="Flowspace" />

# 🚀 Flowspace - Full Stack Project Management System

**A modern, feature-rich project management platform built with React + Spring Boot**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://www.java.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Docs](#-api-documentation) · [Screenshots](#-screenshots) · [Contributing](#-contributing)

---

</div>

## 📌 Overview

**Flowspace** is a comprehensive, production-ready project management application designed for software development teams. It combines real-time collaboration, AI-powered productivity tools, Kanban boards, analytics, and video meetings into one unified platform making it the only tool your team needs to plan, build, and ship software.

Built with a **React + Vite** frontend and a **Java Spring Boot** backend, Flowspace delivers a modern, responsive UI with a robust, secure REST API backed by **PostgreSQL**.

> 🎯 **Goal:** Replace scattered tools like Jira, Slack, Zoom, and Notion with a single, integrated workspace for development teams.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with role-based access control
- Three user roles: **Admin**, **Project Manager**, and **Member**
- Secure password hashing with BCrypt
- Protected routes - unauthenticated users are redirected to login
- Admin dashboard for full user management

### 📋 Project Management
- Create, edit, and delete projects with start/end dates
- Paginated project listing with search functionality
- Project ownership and member management
- Per-project analytics, workload, and velocity tracking
- Full audit log of all project activity

### ✅ Task Management
- Full CRUD for tasks within projects
- Task statuses: **TODO → IN_PROGRESS → DONE**
- Assign tasks to team members
- Task dependencies (blocking relationships)
- File attachments on tasks
- Comments and threaded discussion per task
- Subtask breakdown
- Due date tracking with overdue detection

### 🗂 Kanban Board
- Drag-and-drop task cards across columns
- Visual **TODO / IN_PROGRESS / DONE** swimlanes
- Real-time board updates

### 📊 Analytics & Reporting
- Task completion percentage and pie charts
- **Critical Path** analysis - identifies tasks that block project completion
- **Slack analysis** - shows how much buffer each task has
- **Gantt timeline** - visual project schedule
- **Workload view** - per-member task distribution
- **Velocity charts** - weekly completed tasks over time with cumulative view
- Project-level audit logs

### 🤖 AI Tools (Powered by Groq + Llama 3.1)
- **AI Daily Standup Generator** - reads your real task data and writes an accurate standup update
- **AI Task Breakdown** - describe any feature and get 5–8 actionable subtasks with priorities and time estimates
- Tone selector: Professional / Casual / Detailed
- **AI Chatbot** - floating assistant on every page for PM advice, writing help, and sprint planning
- Context-aware: knows your username, current page, and your project list

### 💬 Communication
- **Project Chat** - real-time messaging per project with @mentions
- **Announcements** - pin/unpin important project-wide messages
- **Direct Messages** - private 1:1 conversations between users
- **Activity Feed** - live audit feed of all your actions across all projects

### 📅 Meetings
- Schedule meetings with type (Standup, Planning, Review, Retrospective, 1:1, General)
- Set attendees, agenda, notes, and action items
- Link meetings to specific projects
- Status tracking: Scheduled → In Progress → Completed / Cancelled
- **Video Calls** - embedded real-time HD video calling
- "Time until" countdown for upcoming meetings
- Copy invite link to share with anyone

### 👥 Team & Members
- Add/remove members per project
- Role assignment: Owner, Project Manager, Member
- User profiles with task statistics
- Admin panel for system-wide user management

### 🎨 UI & Experience
- Dark/Light theme toggle with persistent preference
- Fully responsive layout
- Smooth animations and micro-interactions
- CSS variable-based theming throughout
- Time-aware greeting on dashboard ("Good morning, Siddhesh 👋")
- Real-time stats and live data throughout

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool & dev server |
| React Router DOM | 6 | Client-side routing |
| Axios | 1.x | HTTP client |
| Recharts | 2.x | Charts and data visualization |
| React Hot Toast | 2.x | Notifications |
| Groq SDK | — | AI features (Llama 3.1) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 17 | Programming language |
| Spring Boot | 3.x | Application framework |
| Spring Security | 6.x | Authentication & authorization |
| Spring Data JPA | 3.x | Database ORM |
| PostgreSQL | 15 | Primary database |
| JWT (jjwt) | 0.12 | Token-based auth |
| Lombok | 1.18 | Boilerplate reduction |
| Maven | 3.x | Build & dependency management |

---

## 📁 Project Structure

```
Flowspace---Full-Stack-App/
│
├── flowspace-frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── api/                        # Axios API modules
│   │   │   ├── axiosInstance.js        # JWT interceptor
│   │   │   ├── authApi.js
│   │   │   ├── projectApi.js
│   │   │   ├── taskApi.js
│   │   │   ├── socialApi.js
│   │   │   ├── memberApi.js
│   │   │   ├── notificationApi.js
│   │   │   └── meetingApi.js
│   │   ├── components/
│   │   │   └── shared/
│   │   │       ├── Navbar.jsx
│   │   │       ├── AIChatbot.jsx
│   │   │       ├── ErrorBoundary.jsx
│   │   │       └── VideoCallModal.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # JWT + role state
│   │   │   └── ThemeContext.jsx        # Dark/light theme
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProjectDetailPage.jsx
│   │   │   ├── KanbanPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── WorkloadPage.jsx
│   │   │   ├── VelocityPage.jsx
│   │   │   ├── ProjectMembersPage.jsx
│   │   │   ├── ProjectChatPage.jsx
│   │   │   ├── DirectMessagesPage.jsx
│   │   │   ├── ActivityFeedPage.jsx
│   │   │   ├── AIToolsPage.jsx
│   │   │   ├── MeetingPage.jsx
│   │   │   ├── UserProfilePage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── AdminPage.jsx
│   │   └── App.jsx
│   ├── .env                            # API keys (not committed)
│   ├── .gitignore
│   ├── package.json
│   └── vite.config.js
│
└── flowspace-backend/                  # Spring Boot backend
    ├── src/main/java/.../
    │   ├── controller/                 # REST controllers
    │   ├── service/                    # Business logic
    │   ├── model/                      # JPA entities
    │   ├── dto/                        # Data transfer objects
    │   ├── repository/                 # Spring Data repositories
    │   ├── security/                   # JWT filter, config
    │   └── exception/                  # Custom exceptions
    ├── src/main/resources/
    │   └── application.properties      # DB config, JWT secret
    ├── .gitignore
    └── pom.xml
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **Java** 17+
- **PostgreSQL** 15+
- **Maven** 3.8+
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/SidTirse-13/Flowspace---Full-Stack-App.git
cd Flowspace---Full-Stack-App
```

---

### 2. Backend Setup

```bash
cd flowspace-backend
```

**Configure the database** — open `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/flowspace
spring.datasource.username=your_postgres_username
spring.datasource.password=your_postgres_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

jwt.secret=your_super_secret_jwt_key_at_least_32_characters
jwt.expiration=86400000
```

**Create the database:**
```sql
CREATE DATABASE flowspace;
```

**Run the backend:**
```bash
mvn spring-boot:run
```

Backend starts at `http://localhost:8080`

---

### 3. Frontend Setup

```bash
cd flowspace-frontend
npm install
```

**Create a `.env` file** in the frontend root:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GROQ_API_KEY=your_groq_api_key_here
```

> Get a free Groq API key at [console.groq.com](https://console.groq.com) — required for AI features.

**Run the frontend:**
```bash
npm run dev
```

Frontend starts at `http://localhost:5173`

---

### 4. Open the App

Navigate to `http://localhost:5173` and register your first account.

> 💡 The first user you register can be promoted to **ADMIN** role directly in the database:
> ```sql
> UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';
> ```

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT token |
| PUT | `/api/auth/change-password` | Change password |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get paginated projects |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/{id}` | Edit project |
| DELETE | `/api/projects/{id}` | Delete project |
| GET | `/api/projects/search?query=` | Search projects |
| GET | `/api/projects/{id}/analytics` | Project analytics |
| GET | `/api/projects/{id}/gantt` | Gantt chart data |
| GET | `/api/projects/{id}/critical-path` | Critical path |
| GET | `/api/projects/{id}/workload` | Team workload |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{id}/tasks` | Get all tasks |
| POST | `/api/projects/{id}/tasks` | Create task |
| PUT | `/api/projects/{id}/tasks/{taskId}` | Edit task |
| DELETE | `/api/projects/{id}/tasks/{taskId}` | Delete task |
| GET | `/api/tasks/my-tasks` | My assigned tasks |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings` | All meetings for user |
| GET | `/api/meetings/upcoming` | Upcoming meetings |
| POST | `/api/meetings` | Schedule meeting |
| PUT | `/api/meetings/{id}` | Update meeting |
| DELETE | `/api/meetings/{id}` | Delete meeting |
| PATCH | `/api/meetings/{id}/status` | Update status |

### Audit / Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/me` | My activity feed |
| GET | `/api/audit/project/{id}` | Project audit log |
| GET | `/api/audit/task/{id}` | Task audit log |

> All endpoints (except `/api/auth/*`) require a Bearer JWT token in the `Authorization` header.

---

## 🔑 Environment Variables

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GROQ_API_KEY=               # From console.groq.com (free)
```

### Backend `application.properties`
```properties
spring.datasource.url=           # PostgreSQL connection URL
spring.datasource.username=      # DB username
spring.datasource.password=      # DB password
jwt.secret=                      # Min 32 character secret key
jwt.expiration=86400000          # Token expiry in ms (24 hours)
```

> ⚠️ **Never commit `.env` or `application.properties` with real credentials to GitHub.**

---

## 👤 User Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access — manage all users, roles, and projects system-wide |
| **PROJECT_MANAGER** | Create/manage projects, add members, full task control |
| **USER** | View assigned projects, manage own tasks, use all features |

---

## 🤖 AI Features Setup

Flowspace uses **Groq's free API** with **Llama 3.1 8B** for AI features.

1. Sign up free at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Add it to your `.env` as `VITE_GROQ_API_KEY`

**AI features include:**
- Daily standup generation from real task data
- Feature breakdown into actionable subtasks
- Floating AI chatbot on every page
- Sprint planning assistance
- Meeting announcement drafting

---

## 🙌 Contributing

Contributions are welcome! Here's how to get started:

```bash
# Fork the repo, then clone your fork
git clone https://github.com/YOUR_USERNAME/Flowspace---Full-Stack-App.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then commit
git add .
git commit -m "feat: add your feature description"

# Push and open a Pull Request
git push origin feature/your-feature-name
```

### Commit Convention
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation update
- `refactor:` — code refactor
- `style:` — UI/styling changes

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.



## 👨‍💻 Author

**Siddhesh Tirse**

[![GitHub](https://img.shields.io/badge/GitHub-SidTirse--13-181717?style=flat-square&logo=github)](https://github.com/SidTirse-13)

---

<div align="center">

**⭐ If you found this project helpful, please give it a star on GitHub!**

Made with ❤️ using React, Spring Boot, and a lot of ☕

</div>
