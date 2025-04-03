# GitHub Gist Tracker

A full-stack web application for managing GitHub Gists built with Next.js 15, MongoDB, and Tailwind CSS.

## Features

- **User Authentication**

  - Register with email & password
  - Login and logout functionality
  - Protected routes for authenticated users

- **Profile Management**

  - View and edit profile information
  - Add GitHub token for API access
  - Delete account

- **Gist Management**

  - Create new gists
  - View list of gists with pagination
  - Edit and delete existing gists
  - Search gists by description or filename

- **Responsive Design**
  - Works on mobile, tablet, and desktop screens

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS V4
- **Backend**: API routes in Next.js
- **Database**: MongoDB (via Mongoose)
- **Form Handling**: React Hook Form + Zod
- **API Integration**: GitHub Gist API

## Prerequisites

- Node.js 18.x or later
- MongoDB database (or MongoDB Atlas account)
- GitHub personal access token with gist scope

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# MongoDB Connection String
MONGODB_URL=mongodb+srv://peter:35407835@nodejsandexpress.kvscu.mongodb.net/Technical?retryWrites=true&w=majority&appName=nodejsandexpress

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## Getting Started

1. Clone the repository

   ```
   git clone <repository-url>
   cd github-gist-tracker
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Run the development server

   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Create an account or log in
2. Add your GitHub personal access token in the profile settings
3. Start managing your gists!

## Building for Production

```
npm run build
npm start
```

## Deployment

This application can be deployed to any platform that supports Next.js, such as Vercel, Netlify, or a custom server.

## License

MIT
