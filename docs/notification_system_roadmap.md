# Phase 2: Comprehensive Notification System Roadmap

This document outlines the long-term vision and architecture for Phase 2 of the `eve-dash` Character Notifications integration. While Phase 1 strictly handles data extraction, Phase 2 will implement the UI, local state management, and Traffic Light thresholds for critical game events.

## 1. Vision & Core Objective
Eliminate the need to log into each character to check for existential threats (War Declarations, Upwell Structure attacks/reinforcements, Corporation bill failures). The worst-case notification must bubble up to the global Traffic Light dashboard.

## 2. Traffic Light Math (Thresholds)
Notifications will be parsed and evaluated via pure math functions in `src/utils/thresholds/` to determine their severity:

- 🔴 **RED (Critical Alert / Action Required):**
  - **Structures:** `StructureUnderAttack`, `StructureLostShields`, `StructureLostArmor` (Reinforced).
  - **Wars:** Active War Declarations (`WarDeclared`).
  - **Finances:** `CorpAllBillMsg` (Bill overdue/failed).
  - **Sovereignty:** `SovCommandNodeEventStarted`.
- 🟡 **YELLOW (Warning / Impending Event):**
  - **Wars:** Impending War Declaration (e.g., 24-hour warmup period).
  - **Structures:** `StructureFuelAlert` (Low fuel).
- 🟢 **GREEN (Optimal):**
  - No unread critical alerts. Structures healthy, no active wars.

## 3. Read/Unread State Management (Zero-Backend)
Because `eve-dash` is a 100% Client-Side Static SPA, ESI does not track whether a user has "read" a notification.
- **Local State Tracking:** We will use a new IndexedDB repository (`NotificationStateRepository`) to map the ESI `notification_id` to a local boolean (`isRead`).
- **Separation of Concerns:** Raw ESI payloads (synced via `NotificationRepository` in Phase 1) remain immutable. User mutations (read state) are kept isolated to prevent data corruption during ESI syncs.
- **Muting:** A "Mark All as Read" action will update the local IDB state, instantly muting the notification so it no longer contributes to the Red/Yellow Traffic Light threshold.

## 4. UI Topology & Aesthetic
Adhering strictly to the Anti-Slop NeoCom Design Guardrails:
- **Notification Drawer/Bell:** A global NeoCom sidebar bell icon that glows Red/Yellow if any character has an unread critical notification.
- **Notification Feed:** A dedicated flyout or page listing notifications, grouped by severity, then by character.
- **Design Tokens:** Sharp corners, deep blacks (`bg-zinc-950`), glowing amber/red accents for critical alerts, tabular numerals for timestamp rendering.

## 5. Background Watchtower (Metagame Concept)
- Eventually tie unread critical notifications into the Background Sync API (Autonomous PWA Watchtower) to trigger native OS desktop notifications even when the dashboard tab is closed.
