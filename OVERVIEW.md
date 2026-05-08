# Silicon Systems HelpDesk - Project Overview

## 📋 Project Details
- **Project Name**: Silicon Systems HelpDesk
- **Version**: 2.1
- **Tech Stack**:
  - **Backend**: Django 6.0.2 (Django REST Framework)
  - **Frontend**: Next.js 16.1.6 (React 19, Tailwind CSS 4)
  - **Database**: PostgreSQL
  - **Authentication**: JWT (JSON Web Tokens)

## 🎯 Project Objective
The Silicon Systems HelpDesk is an enterprise-grade ticketing system designed to streamline support operations. It provides a centralized platform for:
- **Clients** to report issues and track their resolution progress.
- **Support Members** to manage and resolve assigned technical issues.
- **Administrators** to oversee the entire system, manage users, and analyze performance metrics.

The objective is to improve response times, provide transparency in issue resolution, and offer data-driven insights through comprehensive analytics.

## ⚙️ How the System Works
The system follows a standard Client-Server architecture with role-based access control (RBAC).

### Core Workflow:
1. **Issue Creation**: A Client submits a ticket with a description and category.
2. **Assignment**: An Admin reviews the ticket and assigns it to a Support Member with the matching technical specialty.
3. **Resolution Lifecycle**: The ticket moves through several statuses:
   `CREATED` → `ASSIGNED` → `STARTED` → `RESOLVED` → `CLOSED`
4. **Audit Trail**: Every change (status update, assignment, message) is logged in the `TicketActivity` model, providing a full history of the ticket's lifecycle.
5. **Real-time Interaction**: Users can communicate through a chat interface within each ticket.

### Request Flow:
- Frontend (Next.js) sends authenticated HTTP requests (with JWT) to the Backend (DRF).
- Backend validates permissions, processes business logic, and interacts with the PostgreSQL database.
- Data is returned as JSON and rendered by React components.

## 📁 Function of Files & Directories

### Backend (`/backend`)
- **`accounts/`**: Manages custom user models with roles (Admin, Member, Client) and authentication views.
- **`core/`**: Defines the fundamental issue categories and sub-issues.
- **`tickets/`**: The heart of the system. Contains models for Tickets, Members, Clients, and Activity logs.
- **`config/`**: Project-level settings, URL routing, and WSGI/ASGI configuration.
- **`manage.py`**: Command-line utility for administrative tasks (migrations, server, etc.).

### Frontend (`/frontend`)
- **`app/`**: Contains the Next.js App Router pages (Dashboard, Login, Ticket management).
- **`components/`**: Reusable UI components like `StatusBadge`, `TicketChatbox`, and `TicketCard`.
- **`lib/`**: Utility functions, specifically `api.ts` which handles JWT-authenticated API calls.
- **`public/`**: Static assets, including the Silicon Systems logo.

## 🖥️ Backend and Frontend Description

### Backend (API)
The backend is a robust REST API that enforces strict security and business rules.
- **Role-Based Filtering**: The database queries are automatically filtered based on the user's role (e.g., Clients only see their own tickets).
- **Status Transitions**: A strict workflow is enforced; for example, a ticket cannot skip the `ASSIGNED` status to reach `STARTED`.
- **Analytics Engine**: Provides aggregated data for dashboard visualizations.

### Frontend (User Interface)
The UI is built with a modern, tech-focused SaaS aesthetic using "Silicon Systems" branding.
- **Dashboard**: Features real-time charts (Recharts) showing status distribution and monthly trends.
- **Tickets Page**: Implements a "Dual-View" system:
  - **Desktop**: A comprehensive table view with advanced filtering.
  - **Mobile**: A card-based layout optimized for touch interaction and smaller screens.
- **Ticket Details**: An action-oriented interface with modals for chat and status updates.
- **Branding**: Uses a professional tech-blue color scheme with a fixed, dark sidebar for easy navigation.
