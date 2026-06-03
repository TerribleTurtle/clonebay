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
- **APIs:** EVE Swagger Interface (ESI)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up your EVE Developer application at [developers.eveonline.com](https://developers.eveonline.com/).
   - When creating your application, ensure you add the following **Callback URL**: `http://localhost:3006/auth/callback`
   - You must request the following **OAuth Scopes**:
     - `esi-skills.read_skillqueue.v1`
     - `esi-skills.read_skills.v1`
     - `esi-industry.read_character_jobs.v1`
     - `esi-planets.manage_planets.v1`
     - `esi-wallet.read_character_wallet.v1`
     - `esi-location.read_location.v1`
     - `esi-clones.read_clones.v1`
     - `esi-characters.read_fatigue.v1`
     - `esi-location.read_ship_type.v1`
     - `esi-mail.read_mail.v1`
     - `esi-contracts.read_character_contracts.v1`
     - `esi-markets.read_character_orders.v1`
3. Copy the `.env.example` file to create your own `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Then add your `NEXT_PUBLIC_EVE_CLIENT_ID` to the `.env` file.
4. Run the development server:
   ```bash
   npm run dev
   ```
