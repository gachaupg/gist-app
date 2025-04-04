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
  - Location visualization with Mapbox
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
- **Maps**: Mapbox GL JS

## Prerequisites

- Node.js 18.x or later
- MongoDB database (or MongoDB Atlas account)
- GitHub personal access token with gist scope
- Mapbox access token for location visualization

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# MongoDB Connection String
MONGODB_URL=mongodb+srv://peter:35407835@nodejsandexpress.kvscu.mongodb.net/Technical?retryWrites=true&w=majority&appName=nodejsandexpress

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Mapbox (for location visualization)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-access-token
```

## .env.sample

For convenience, you can copy the following into a `.env.sample` file:

```
# MongoDB Connection String
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# GitHub API (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Mapbox (for location visualization)
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-access-token
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
3. Set your location in the profile settings to see it visualized on a map
4. Start managing your gists!

## Building for Production

```
npm run build
npm start
```

## Deployment

This application can be deployed to any platform that supports Next.js, such as Vercel, Netlify, or a custom server.

## License

MIT
