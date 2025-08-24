# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voice Journal (Speak Log) is a Korean voice-based personal growth platform that allows users to record daily plans and reflections, which are transcribed using OpenAI's Whisper API and stored with goal tracking capabilities.

## Essential Commands

```bash
# Development
npm run dev                 # Start development server on port 3000

# Database
npm run db:push            # Push schema changes to database (development)
npm run db:migrate         # Create and apply migrations
npm run db:studio          # Open Prisma Studio for database inspection
npm run db:generate        # Generate Prisma client

# Build & Production
npm run build              # Build for production (runs prisma generate first)
npm run start              # Start production server

# Deployment
vercel                     # Deploy to preview
vercel --prod             # Deploy to production

# Testing & Validation
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript compiler check (if configured)
```

## Architecture Overview

### Tech Stack
- **Next.js 15.2.4** with App Router - Full-stack React framework
- **Prisma ORM** with PostgreSQL (Supabase) - Database layer
- **NextAuth.js v4** - Google OAuth authentication
- **OpenAI Whisper API** - Speech-to-text transcription
- **AWS S3** - Audio file storage
- **shadcn/ui + Tailwind CSS** - UI components and styling

### Core Data Flow
1. User uploads audio → Stored in S3 → Transcribed via Whisper API → Saved to PostgreSQL
2. Authentication: Google OAuth → NextAuth → JWT session (30 days) → User record in DB
3. API calls tracked in TokenUsage table for cost monitoring

### Key API Endpoints
- `/api/transcribe` - Main transcription endpoint (handles S3 upload + Whisper API)
- `/api/voice-entries/*` - CRUD for voice recordings
- `/api/goals/*` - Goal management and tracking
- `/api/stats/streak` - User analytics and progress tracking
- `/api/admin/daily-report` - Email reports of API usage (protected with CRON_SECRET)

### Database Schema Key Models
- **VoiceEntry**: Audio recordings with `type` (plan/reflection), transcription, mood, confidence
- **Goal**: Daily goals with priority levels, completion status, target dates
- **TokenUsage**: Tracks OpenAI API usage and costs per user/endpoint

### Protected Routes
The middleware (`middleware.ts`) protects all `/api/*` routes except `/api/auth/*` - requires authenticated session.

## Critical Implementation Details

### Audio Upload Flow (app/api/transcribe/route.ts)
1. Accepts multipart form data with audio file
2. Validates file type (mp3, wav, m4a, ogg) and size (< 25MB)
3. Uploads to S3 with unique key: `voice-recordings/${userId}/${timestamp}-${filename}`
4. Sends to OpenAI Whisper with Korean prompt
5. Tracks token usage and costs
6. Returns transcription and S3 URL

### Goal Extraction (app/api/goals/extract/route.ts)
Uses GPT-4 to extract structured goals from transcribed text, identifying:
- Goal content, priority, estimated time
- Automatic categorization and parsing

### Email Reporting (lib/email.ts)
Daily usage reports sent via nodemailer with SMTP configuration.
Requires environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL

## Environment Variables

Required for local development (in .env.local):
```env
# Core Services
OPENAI_API_KEY=            # OpenAI API key for Whisper and GPT
DATABASE_URL=               # PostgreSQL connection (pooled)
DIRECT_URL=                 # PostgreSQL direct connection (migrations)

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=            # Generate with: openssl rand -base64 32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=                  # Gmail app password
ADMIN_EMAIL=
CRON_SECRET=                # For protecting cron endpoints
```

## Common Development Tasks

### Adding New API Endpoints
1. Create route in `app/api/[endpoint]/route.ts`
2. Use `getServerSession(authOptions)` for auth
3. Track API usage with TokenUsage model if using OpenAI
4. Return NextResponse with appropriate status codes

### Modifying Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` for development
3. Run `npm run db:migrate` for production migrations
4. Run `npm run db:generate` to update client types

### Working with Voice Entries
- Types: "plan" (evening planning) or "reflection" (morning review)
- Always store both original and processed text
- Track mood and confidence scores (1-5 scale)

### Deploying Updates
1. Ensure all environment variables are set in Vercel dashboard
2. Test locally with `npm run build`
3. Deploy with `vercel --prod`
4. Monitor function logs in Vercel dashboard

## Important Conventions

- All dates/times stored in UTC, displayed in user's timezone
- File uploads limited to 25MB
- Audio formats: mp3, wav, m4a, ogg only
- Token costs calculated based on OpenAI pricing (stored in cents)
- User deletion cascades through all related records
- S3 URLs are private, accessed via presigned URLs