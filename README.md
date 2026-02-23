# VendoCare

VendoCare is a comprehensive Vendor Management System built to simplify and streamline interactions between organizations and their vendors. The platform enables administrators to manage vendors, contracts, and invoices efficiently, while providing vendors with a dedicated dashboard to track their engagements.

## Application Architecture

This project is structured as a monorepo with separate `frontend` and `backend` directories.

### Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, Prisma (ORM), PostgreSQL (or corresponding DB)

## Features

- **Admin/Vendor Roles**: Distinct dashboards and features based on user roles.
- **Vendor Management**: Administrators can register, monitor, and manage vendors seamlessly.
- **Contract Tracking**: Easily track active, pending, and expired contracts.
- **Invoice Processing**: Automated workflows to view and approve invoices.
- **Action Items**: A dedicated section to track tasks, due dates, and tags.
- **Secure Authentication**: JWT-based authentication for secure access.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RitunjKaushik20/VendoCare.git
   cd VendoCare
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   - Create a `.env` file in the `backend` directory based on `.env.example`.
   - Run database migrations: `npx prisma db push` (or `npx prisma migrate dev`).
   - Start the backend server: `npm run dev`

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   - Create a `.env` file referencing the backend API URL (e.g., `VITE_API_URL=http://localhost:5000/api`).
   - Start the frontend development server: `npm run dev`

## Deployment
Both frontend and backend are structured for standard deployment pipelines. 
- Backend can be deployed to Render, Heroku, or any Node.js hosting platform using the provided `Dockerfile` or direct deployment methods.
- Frontend can be built using `npm run build` and served via Vercel, Netlify, or Nginx.

## Directory Structure
- `/frontend`: Contains the React/Vite web application.
- `/backend`: Contains the Node.js/Express REST API and Prisma schema.
