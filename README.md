# MindMate Backend

A backend service for an AI-powered mental health companion application built with Node.js, Express, and Supabase. The system supports user profiles, chat history, mood tracking, journaling, and crisis alerts with secure access control using JWT authentication and Row Level Security (RLS).

---

## Live API

[https://you-matter-backend.onrender.com/api/v1](https://you-matter-backend.onrender.com/api/v1)

---

## Tech Stack

* Node.js
* Express.js
* Supabase (Authentication and Database)
* PostgreSQL (with Row Level Security)
* Zod (request validation)
* Nodemailer (email alerts)
* Render (deployment)

---

## Authentication

This backend uses Supabase JWT-based authentication.

All protected routes require the following header:

Authorization: Bearer <access_token>

---

## Setup Instructions

### 1. Clone the repository

git clone [https://github.com/HarshitaSmriti/You_Matter.git](https://github.com/HarshitaSmriti/You_Matter.git)
cd You_Matter

### 2. Install dependencies

npm install

### 3. Create environment file

Create a `.env` file in the root directory and add:

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

### 4. Run the server

npm run dev

Server will run at:
[http://localhost:5000](http://localhost:5000)

---

## API Endpoints

### User

POST /users
GET /users

### Chat

POST /message
GET /conversation

### Mood

POST /mood
GET /mood

### Diary

POST /diary
GET /diary

### Crisis

POST /crisis

---

## Security

* Row Level Security (RLS) is enabled in Supabase
* Users can only access and modify their own data
* JWT tokens are verified through middleware
* Sensitive credentials are not stored in the repository

---

## Features

* User profile creation
* Chat message storage and retrieval
* Mood tracking with score, label, and notes
* Personal diary entries
* Crisis alert system with email notification
* Rate limiting for sensitive endpoints

---

## Project Structure

src/
├── controllers/
├── routes/
├── middleware/
├── validators/
├── config/

---

## Notes

* Do not commit the `.env` file
* Ensure Supabase authentication is used to generate access tokens
* All database operations are protected by RLS policies

---

## Author

Harshita Smriti

---

## Future Improvements

* AI chat integration
* Therapist dashboard
* Frontend integration
* Advanced mood analytics
* Real-time features
