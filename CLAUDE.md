# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Baddybuddy is a web app for managing badminton signups. It uses OCR (Google Cloud Vision API) to parse signup screen images and track court availability and player queue times. Live at https://baddybuddy.vercel.app.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
npx vitest       # Run tests
npx prisma db push  # Apply schema changes to database
```

## Tech Stack

- **Framework**: Next.js 14 with T3 Stack (tRPC + Prisma + TypeScript)
- **UI**: shadcn/ui components in `src/components/ui/` (Radix UI + TailwindCSS)
- **API**: tRPC for type-safe endpoints
- **Database**: PostgreSQL via Prisma ORM
- **External Services**: Google Cloud Vision API (OCR), Google Cloud Storage (images)

## Architecture

### Key Directories
- `src/pages/` - Next.js pages (`groups/[id].tsx` is the main group page)
- `src/server/api/routers/` - tRPC routers (groups, players, signups, issues)
- `src/server/lib/signup_state/` - OCR parsing and court detection logic
- `src/components/groups/` - Feature components for group management

### Data Flow: Image Processing
1. User uploads image → presigned URL from Google Cloud Storage
2. Backend calls Google Vision API for text detection (results cached by MD5 hash)
3. `bintang_burlingame.ts` parses annotations to detect court boundaries and player queues
4. SignupState stored as JSON blob, UI projects current state based on elapsed time

### Path Alias
Use `~/` to import from `src/` (e.g., `import { api } from "~/utils/api"`)

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CREDENTIALS` - Service account JSON for Vision API + Cloud Storage
- `BUCKET_NAME` - GCS bucket name
- `GITHUB_TOKEN` - For issue reporting feature
