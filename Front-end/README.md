# Document Management System

A modern document management web application built with **Vite + React**, **React Router v6**, and a **json-server** mock API. The project is scaffolded and ready for feature development.

---

## ✨ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite) |
| Routing | React Router v6 |
| State | Context API + useReducer |
| Mock API | json-server |
| E2E Tests | Cypress |
| Styling | CSS Custom Properties (dark-mode ready) |

---

## 📁 Project Structure

```
document-management-system/
├── cypress/                  # Cypress E2E test suite
│   ├── e2e/                  # Test spec files (*.cy.js)
│   ├── fixtures/             # Static test data
│   └── support/              # Global commands & setup
├── src/
│   ├── components/           # Shared / reusable UI components
│   ├── context/              # React Context providers
│   │   ├── AuthContext.jsx   # Authentication state
│   │   ├── DocumentContext.jsx # Document list state
│   │   └── ThemeContext.jsx  # Dark / light theme
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Page-level route components
│   ├── router/               # React Router configuration
│   ├── services/             # API service modules
│   ├── styles/               # Global CSS
│   └── utils/                # Pure helper functions
├── db.json                   # json-server database seed
├── cypress.config.js         # Cypress configuration
├── vite.config.js            # Vite configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or Yarn / pnpm)

### 1. Clone & Install

```bash
git clone https://github.com/ElKhalil19/document-management-system.git
cd document-management-system
npm install
```

### 2. Start the Mock API (json-server)

```bash
npm run server
```

> json-server listens on **http://localhost:3001**. The Vite dev server proxies `/api/*` requests to it automatically.

### 3. Start the Development Server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Build for Production

```bash
npm run build
npm run preview   # serve the built output locally
```

---

## 🧪 Running E2E Tests (Cypress)

Make sure both the dev server and json-server are running first, then:

```bash
# Interactive mode (recommended during development)
npm run cypress:open

# Headless mode (for CI)
npm run cypress:run
```

---

## 🌙 Dark Mode

The app ships with a CSS-variable-based dark mode. Toggle it programmatically via the `ThemeContext`:

```jsx
import { useTheme } from '@/context/ThemeContext'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return <button onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
}
```

---

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run server` | Start json-server on port 3001 |
| `npm run cypress:open` | Open Cypress in interactive mode |
| `npm run cypress:run` | Run Cypress headlessly |

---

## 🗄️ Mock Database (db.json)

`db.json` is the data store for json-server. It is pre-seeded with empty arrays for all resource types:

```json
{
  "users": [],
  "documents": [],
  "comments": [],
  "categories": [],
  "departments": [],
  "tags": [],
  "activityLogs": []
}
```

The REST API follows json-server conventions:

| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/documents | List documents |
| POST | /api/documents | Create document |
| GET | /api/documents/:id | Get document |
| PUT | /api/documents/:id | Update document |
| DELETE | /api/documents/:id | Delete document |

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m 'feat: add your feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📄 License

MIT
