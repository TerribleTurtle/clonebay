# EVE Online Unified Multibox Command Center

A modern, hosted web application built with Next.js and Tailwind CSS that completely eliminates "alt-tab chore fatigue" for EVE Online multiboxers. 

## The Problem
Managing 3+ accounts requires constant alt-tabbing or logging in across multiple sessions just to check routine timers. Existing tools are either outdated Java desktop applications or heavy, self-hosted corporate IT backbones.

## The Solution
A "Single Pane of Glass" read-only dashboard that monitors the passive and asynchronous states of every character in a multibox fleet without needing to log them into the game client.

### Core Features
- **Multi-Character EVE SSO:** Authenticate all your characters securely.
- **Traffic Light Health Dashboard:** Red/Yellow/Green indicators for character status.
- **Unified Timer Aggregation:** 
  - Skill Queue monitoring (prevents empty queues).
  - Planetary Interaction (PI) extractor cycles.
  - Industry job completions.

## Technology Stack
- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** Prisma ORM with SQLite (for token persistence)
- **APIs:** EVE Swagger Interface (ESI)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up your EVE Developer application at [developers.eveonline.com](https://developers.eveonline.com/).
3. Create a `.env` file in the root directory with your `CLIENT_ID` and `SECRET_KEY`.
4. Initialize the Prisma database (commands to follow in development).
5. Run the development server:
   ```bash
   npm run dev
   ```
