# JazaCV Resume Builder — Backend

## What this project is

This repository is the backend API for the JazaCV resume builder platform. It provides authentication, user profile management, resume storage, template access control, PDF generation, AI-powered resume improvements, CV tuning, file uploads, subscription payments, and admin operations.

## What the project is all about

JazaCV helps job seekers build stronger resumes faster. The backend powers:

- user registration, login, and JWT-based authentication
- resume creation and editing with structured sections
- selection of professional templates, including free and premium options
- AI enhancements for bullets, summaries, and skills
- CV tuning from uploaded resumes plus job descriptions
- PDF resume export
- payment-based plan upgrades with Paystack
- Cloudinary file uploads for avatars and document storage
- admin tools for managing templates and monitoring resumes

## How it works

1. A user registers or logs in through the frontend.
2. The frontend sends requests to this backend with a JWT token.
3. The user selects a resume template and builds content in sections like experience, education, skills, and projects.
4. Resumes are saved to PostgreSQL via Prisma and linked to the user.
5. Premium templates are blocked for free users; PRO plan users can use them.
6. Users can download resumes as PDF using the backend's Puppeteer-based PDF generator.
7. The AI module can rewrite, improve, summarize, and suggest skills using OpenAI, Gemini, or Anthropic.
8. The CV tuning feature accepts PDF/DOCX/TXT uploads plus a job description and returns AI-suggested improvements.
9. The payments module verifies Paystack transactions and updates user plans.
10. Admin endpoints let admins manage templates, view resumes, and perform moderation.

## Core features

- Authentication and authorization with Passport JWT
- User profile updates, avatar uploads, password change
- Resume CRUD operations, duplication, and PDF export
- Template filtering by free/pro plan
- AI resume rewriting, improvement, summary, and skill suggestions
- CV tuning for uploaded files with targeted job description matching
- Paystack payment initialization, verification, and webhook handling
- Cloudinary file management for avatars and CV uploads
- Swagger API docs available at `/docs`
- Global validation, exception handling, and rate limiting

## Architecture

- NestJS server
- Prisma ORM with PostgreSQL
- Cloudinary for uploads
- Paystack for payments
- OpenAI / Anthropic / Gemini for AI enrichment
- Redis + Bull queue support
- Puppeteer for PDF generation

## Getting started

```bash
cd resume-builder-backend
npm install
npm run prisma:generate
npm run prisma:migrate dev
npm run start:dev
```

Then open http://localhost:3000 and http://localhost:3000/docs for API documentation.

## Recommended environment variables

Create a `.env` file with the following values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=1d
FRONTEND_URL=http://localhost:8080
ALLOW_ALL_ORIGINS=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
AI_PROVIDER=anthropic
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_MODEL=gpt-3.5-turbo
GEMINI_PRO_MODEL=gemini-pro
ANTHROPIC_MODEL=claude-sonnet-4-20250514
PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

> Note: Set only the keys required by your chosen AI provider.

## Useful commands

- `npm run start:dev` — run in development mode with hot reload
- `npm run build` — compile production build
- `npm run start:prod` — run compiled production server
- `npm run test` — run Jest tests
- `npm run test:e2e` — run end-to-end tests
- `npm run test:cov` — generate coverage report
- `npm run prisma:studio` — open Prisma Studio

## API documentation

Swagger docs are available at `/docs` once the backend is running.

## Notes

- The service uses `http://localhost:3000` by default for local development.
- The frontend should call this backend with the same host or by setting `VITE_API_URL`.
- Make sure Redis and PostgreSQL are available if you use queue processing or Prisma migrations.
