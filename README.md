
# 🚀 Flowspace — Full Stack Project Management Platform

<div align="center">

![Flowspace Banner](https://img.shields.io/badge/Flowspace-Project%20Management-6c63ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=for-the-badge&logo=springboot)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens)

**A modern, feature-rich project management platform built with React + Spring Boot**

[✨ Features](#-features) • [🛠 Tech Stack](#-tech-stack) • [📦 Installation](#-installation) • [🔌 API Reference](#-api-reference) • [📸 Screenshots](#-screenshots) • [🤝 Contributing](#-contributing)

</div>


## 📖 About Flowspace

**Flowspace** is a full-stack project management application designed to help software teams plan, track, and deliver projects efficiently. It brings together task management, team collaboration, real-time communication, AI-powered tools, and video meetings — all in one beautifully designed platform.

Built with a **React + Vite** frontend and a **Spring Boot** backend, Flowspace features a dark-themed, professional UI that makes project management feel intuitive and enjoyable.

> 💡 Inspired by tools like Jira, Linear, and Notion — but built from scratch with modern technologies.


## ✨ Features

### 🗂 Project Management
- Create, edit, and delete projects with full CRUD operations
- Paginated project listing with search functionality
- Project analytics including completion rate, critical path, and slack analysis
- Gantt chart visualization for timeline tracking
- Workload distribution across team members

### ✅ Task Management
- Create tasks with title, description, priority, start/end dates
- Drag-and-drop **Kanban board** (TODO → IN_PROGRESS → DONE)
- Task dependencies — block tasks until prerequisites are complete
- File attachments on tasks
- Task comments with threaded discussions
- Subtask support
- Bulk task operations
- Task audit logs — full history of every change

### 👥 Team Collaboration
- Project member management (Owner, Project Manager, Member roles)
- Role-based access control throughout the app
- Direct messaging between users
- Project chat rooms with announcements and @mentions
- Pin important announcements
- Activity feed showing all workspace actions

### 📊 Analytics & Reporting
- Project completion percentage
- Critical path analysis
- Slack table (task float time)
- Gantt timeline visualization
- Workload heatmap per member
- **Velocity charts** — weekly completed tasks over time
- Cumulative completion tracking

### 🤖 AI Tools (Powered by Groq · Llama 3.1)
- **AI Daily Standup Generator** — reads your real task data and writes an accurate standup
- **AI Task Breakdown** — describe a feature, get 5-8 actionable subtasks with estimates
- **AI Chatbot** — floating assistant on every page for PM advice, sprint planning, and more
- Tone selector (Professional / Casual / Detailed)
- Copy-to-clipboard for all AI outputs

### 📅 Meeting Management
- Schedule meetings with title, type, time, location, and attendees
- 6 meeting types: Standup, Planning, Review, Retrospective, 1:1, General
- Meeting status tracking (Scheduled → In Progress → Completed)
- Agenda, notes, and action items per meeting
- Upcoming meetings countdown timer

### 🔔 Notifications
- Real-time notification bell in navbar
- Unread count badge
- Mark all as read / individual mark as read
- Clear all notifications

### 🎨 UI/UX
- Dark mode by default with light mode toggle
- Fully responsive design
- Smooth animations and transitions
- CSS variable-based theming
- Professional Outfit font throughout
- Gradient accents and glassmorphism effects

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based authorization (USER, PROJECT_MANAGER, ADMIN)
- Admin dashboard for user management
- Secure password change
- Auto-logout on token expiry


## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool & dev server |
| React Router DOM | 6 | Client-side routing |
| Axios | 1.x | HTTP client |
| Recharts | 2.x | Data visualization |
| React Hot Toast | 2.x | Notifications |
| Groq API | — | AI features (Llama 3.1) |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Spring Boot | 3.x | Backend framework |
| Spring Security | 6.x | Authentication & authorization |
| Spring Data JPA | 3.x | Database ORM |
| PostgreSQL | 16 | Primary database |
| JWT (jjwt) | 0.12 | Token-based auth |
| Lombok | 1.18 | Boilerplate reduction |
| Maven | 3.x | Dependency management |

## 📁 Project Structure

```
Flowspace---Full-Stack-App/
│
├── flowspace-frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── api/                        # Axios API calls
│   │   │   ├── axiosInstance.js        # Base axios with JWT interceptor
│   │   │   ├── authApi.js              # Login, register, password
│   │   │   ├── projectApi.js           # Project CRUD & analytics
│   │   │   ├── taskApi.js              # Task management
│   │   │   ├── socialApi.js            # Chat, DMs, reactions
│   │   │   ├── memberApi.js            # Team management
│   │   │   ├── meetingApi.js           # Meeting scheduling
│   │   │   └── notificationApi.js      # Notifications
│   │   │
│   │   ├── components/shared/          # Reusable components
│   │   │   ├── Navbar.jsx              # Top navigation bar
│   │   │   ├── AIChatbot.jsx           # Floating AI assistant
│   │   │   ├── ErrorBoundary.jsx       # Error handling wrapper
│   │   │   └── VideoCallModal.jsx      # Video call component
│   │   │
│   │   ├── context/                    # React contexts
│   │   │   ├── AuthContext.jsx         # Authentication state
│   │   │   └── ThemeContext.jsx        # Dark/light theme
│   │   │
│   │   ├── pages/                      # All page components
│   │   │   ├── LandingPage.jsx         # Public landing page
│   │   │   ├── LoginPage.jsx           # Authentication
│   │   │   ├── RegisterPage.jsx        # User registration
│   │   │   ├── DashboardPage.jsx       # Main dashboard
│   │   │   ├── ProjectDetailPage.jsx   # Task management
│   │   │   ├── KanbanPage.jsx          # Drag-drop board
│   │   │   ├── AnalyticsPage.jsx       # Project analytics
│   │   │   ├── WorkloadPage.jsx        # Team workload
│   │   │   ├── VelocityPage.jsx        # Sprint velocity
│   │   │   ├── ProjectMembersPage.jsx  # Team management
│   │   │   ├── ProjectChatPage.jsx     # Project chat room
│   │   │   ├── DirectMessagesPage.jsx  # 1:1 messaging
│   │   │   ├── ActivityFeedPage.jsx    # Workspace activity
│   │   │   ├── MeetingPage.jsx         # Meeting scheduler
│   │   │   ├── AIToolsPage.jsx         # AI standup & breakdown
│   │   │   ├── UserProfilePage.jsx     # User profiles
│   │   │   ├── AdminPage.jsx           # Admin panel
│   │   │   └── SettingsPage.jsx        # User settings
│   │   │
│   │   └── App.jsx                     # Routes & providers
│   │
│   ├── .env                            # Environment variables (not committed)
│   ├── .gitignore
│   ├── package.json
│   └── vite.config.js
│
└── flowspace-backend/                  # Spring Boot backend
    ├── src/main/java/.../
    │   ├── controller/                 # REST API controllers
    │   ├── service/                    # Business logic
    │   ├── model/                      # JPA entities
    │   ├── dto/                        # Data transfer objects
    │   ├── repository/                 # Spring Data repositories
    │   ├── security/                   # JWT & Spring Security config
    │   └── exception/                  # Custom exceptions
    │
    ├── src/main/resources/
    │   └── application.properties      # App configuration
    │
    ├── .gitignore
    └── pom.xml
```

---

## 📦 Installation

### Prerequisites
- **Node.js** 18+ and npm
- **Java** 17+
- **PostgreSQL** 14+
- **Maven** 3.8+



### 🖥 Frontend Setup

```bash
# 1. Navigate to frontend folder
cd flowspace-frontend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
```

Edit `.env` and add your keys:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

> Get a free Groq API key at [console.groq.com](https://console.groq.com)

```bash
# 4. Start development server
npm run dev
```

Frontend runs at `http://localhost:5173`


### ⚙️ Backend Setup

```bash
# 1. Navigate to backend folder
cd flowspace-backend

# 2. Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE flowspace;"

# 3. Configure application.properties
```

Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/flowspace
spring.datasource.username=your_db_username
spring.datasource.password=your_db_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

jwt.secret=your_very_long_jwt_secret_key_here
jwt.expiration=86400000
```

```bash
# 4. Build and run
mvn spring-boot:run
```

Backend runs at `http://localhost:8080`


## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| POST | `/api/auth/change-password` | Change password |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get paginated projects |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |
| GET | `/api/projects/search` | Search projects |
| GET | `/api/projects/{id}/analytics` | Project analytics |
| GET | `/api/projects/{id}/gantt` | Gantt data |
| GET | `/api/projects/{id}/critical-path` | Critical path |
| GET | `/api/projects/{id}/workload` | Team workload |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{id}/tasks` | Get all tasks |
| POST | `/api/projects/{id}/tasks` | Create task |
| PUT | `/api/projects/{id}/tasks/{taskId}` | Update task |
| DELETE | `/api/projects/{id}/tasks/{taskId}` | Delete task |
| GET | `/api/tasks/my-tasks` | My assigned tasks |
| POST | `/api/projects/{id}/tasks/{taskId}/comments` | Add comment |
| POST | `/api/projects/{id}/tasks/{taskId}/attachments` | Upload file |

### Team & Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{id}/members` | List members |
| POST | `/api/projects/{id}/members` | Add member |
| DELETE | `/api/projects/{id}/members/{username}` | Remove member |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings` | All meetings |
| GET | `/api/meetings/upcoming` | Upcoming meetings |
| POST | `/api/meetings` | Schedule meeting |
| PUT | `/api/meetings/{id}` | Update meeting |
| DELETE | `/api/meetings/{id}` | Delete meeting |
| PATCH | `/api/meetings/{id}/status` | Update status |

### Activity & Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/me` | My activity feed |
| GET | `/api/audit/project/{id}` | Project audit log |
| GET | `/api/audit/task/{id}` | Task audit log |

---

## 🔐 Environment Variables

### Frontend (`.env`)
```env
VITE_GROQ_API_KEY=          # Required — Groq API key for AI features
```

### Backend (`application.properties`)
```properties
spring.datasource.url=      # PostgreSQL connection URL
spring.datasource.username= # Database username
spring.datasource.password= # Database password
jwt.secret=                 # JWT signing secret (min 32 chars)
jwt.expiration=86400000     # Token expiry in ms (24 hours)
```

---

## 👤 Default Roles

| Role | Permissions |
|------|------------|
| `USER` | Create projects, manage own tasks, view team |
| `PROJECT_MANAGER` | All USER permissions + manage all team members |
| `ADMIN` | Full access + user management dashboard |

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy the dist/ folder to Vercel
```

### Backend (Railway / Render)
```bash
mvn clean package -DskipTests
# Deploy the generated .jar file
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes and commit
git commit -m "Add: your feature description"

# 4. Push to your fork
git push origin feature/your-feature-name

# 5. Open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Siddhesh Tirse**

[![GitHub](https://img.shields.io/badge/GitHub-SidTirse--13-181717?style=for-the-badge&logo=github)](https://github.com/SidTirse-13)

---

<div align="center">

**⭐ If you found this project useful, please give it a star!**

Made with ❤️ using React, Spring Boot, and a lot of ☕

</div>
