Establishing user intent: The user wants to transform the current, basic `README.md` into a professional, comprehensive version for a hostel management project called "HostelHub."

The project consists of a Next.js frontend and an Express.js backend using Prisma with a PostgreSQL database. Key features include student and manager profiles, hostel listings, room booking with payment integration, and a complaint management system.

# HostelHub - Professional Hostel Management System

HostelHub is a comprehensive digital platform designed to streamline the hostel search, booking, and management process for students, hostel managers, and administrators.

## 🚀 Project Overview

The system provides a seamless experience for students to find and secure accommodation while giving hostel managers robust tools to handle bookings, payments, and tenant concerns.

### Core Features

* **User Roles**: Specialized profiles for Students, Hostel Managers, Guests, and Administrators.
* **Hostel Management**: Managers can list hostels, define room types (1-in-1 to 4-in-4 occupancy), and manage facilities.
* **Booking System**: Real-time room availability tracking, booking reference generation, and automated check-in/out scheduling.
* **Payment Integration**: Secure payment processing via MTN Mobile Money (MoMo) with automated disbursement tracking for managers.
* **Support & Communication**: Integrated complaint system with tracking and professional review/rating functionality for hostels.

## 🛠️ Tech Stack

### Frontend (App Directory)
* **Framework**: Next.js 16 (React 19)
* **State Management**: Zustand & TanStack Query (React Query)
* **Styling**: Tailwind CSS 4 with Framer Motion for animations
* **UI Components**: Headless UI, Radix UI, and Lucide React

### Backend
* **Runtime**: Node.js with Express
* **Database**: PostgreSQL via Prisma ORM
* **Security**: JWT Authentication, Bcrypt password hashing, Helmet, and Rate-limiting
* **Media**: Cloudinary for hostel and ID image hosting

## 📋 Prerequisites

* Node.js (v18 or higher)
* PostgreSQL database
* Cloudinary Account (for image uploads)
* MTN MoMo API Sandbox/Production credentials

## ⚙️ Installation & Setup

### 1. Backend Configuration
Navigate to the `hostelhub-backend` directory and install dependencies:
```bash
npm install
```

Create a `.env` file and configure your environment variables (Database URL, JWT Secret, Cloudinary credentials, and MoMo keys).

Initialize the database and seed initial data:
```bash
npx prisma migrate dev
npm run seed
```

### 2. Frontend Configuration
Navigate to the `hostelhub` directory and install dependencies:
```bash
npm install
```

### 3. Running the Application
**Start Backend (Development):**
```bash
npm run dev # Runs on http://localhost:5000 (standard Express)
```

**Start Frontend (Development):**
```bash
npm run dev # Runs on http://localhost:3000
```

## 🏗️ Database Schema

The system uses a relational PostgreSQL schema managed by Prisma, featuring:
* **User/Profiles**: One-to-one relations between core Users and Student, Manager, or Guest profiles.
* **Hostels & Rooms**: Hierarchical structure from Hostel -> RoomType -> Room.
* **Transactions**: Links between Bookings, Payments, and Disbursements.


## 📜 Available Scripts

### Backend
* `npm run dev`: Start development server with Nodemon.
* `npm run setup:momo`: Initialize MoMo sandbox environment.
* `npm run verify:keys`: Validate API keys.
* `npm run seed`: Populate database with initial data.

### Frontend
* `npm run dev`: Start Next.js development server.
* `npm run build`: Create a production build.
* `npm run lint`: Run ESLint for code quality.
