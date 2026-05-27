# MyPKM — Product Vision

**Version:** 1.0  
**Date:** May 2026  
**Status:** Draft

---

## The problem

Most people who want to work effectively with AI face a version of the same problem: their knowledge isn't organised in a way that AI can actually use. Notes are scattered across Notion, Apple Notes, browser bookmarks, and email. Even people who maintain a knowledge base find that AI tools struggle to navigate it meaningfully.

The problem has two distinct layers:

**Architectural.** Most knowledge tools store data in proprietary formats on remote servers. AI tools can't read them efficiently, can't commit changes back, can't reason over the full structure. The format itself creates a ceiling.

**Methodological.** Even with the right tool, most people don't know how to organise knowledge so it becomes useful over time — what to capture, how to connect things, how to turn raw notes into a system that works with you instead of against you.

---

## North star

> In plotting all of life's happenings on a timeline, you get to line your doing and productivity up with life itself — and as a side effect, most organisational dilemmas are dispensed with.

MyPKM is a personal knowledge base built on a single organising principle: time. Not as a metaphor — as the actual architecture. Every note, every document, every decision is anchored to the moment it belongs to. The calendar is not a feature. It is the structure.

---

## Target user

Anyone who operates a calendar-heavy day and needs to capture information against events. The initial wedge is software development managers — Git-literate, meeting-heavy, and acutely frustrated that context about their teams, decisions, and relationships is fragmented across tools.

**Initial user profile:**
- Software development managers
- Calendar-heavy professionals
- Git-literate users

---

## Architecture

### One codebase. One format. Your disk.

Every note is a plain Markdown file on the user's disk. There is no database, no proprietary format, no sync lock-in. Files are readable by any tool that can open a text file — today and in twenty years.

Git provides version control. Every change is tracked, diffable, reversible. Collaboration happens via Git — the same way software teams have collaborated for decades, without any proprietary cloud in between.

This architecture directly solves the AI accessibility problem. Files are locally readable, traversable, and writable by an AI agent without hitting API rate limits or proprietary walls.

---

## Timeline model

### Granularity increases as events approach the present

The timeline reflects natural planning horizons. Events begin at a coarse resolution and are manually promoted as they approach — from year → month → specific day and time. Promotion is always a deliberate act. Nothing moves automatically.

| Distance from now | Resolution | Promotion |
|---|---|---|
| Current + next month | Specific day and time | Promoted |
| Next 12 months | Month | Manual |
| Beyond 12 months | Year | Coarse |

---

## Meeting series

### Context accumulates. Nothing fragments.

Recurring meetings — 1:1s, project reviews, programme meetings — form a persistent series. Notes are linked to the series, not just a single occurrence. All documents accumulate in one folder across the lifetime of the series. Navigating to any occurrence surfaces the same shared folder.

The result: a living document of every relationship and topic that matters, growing richer over time rather than fragmenting by date.

---

## AI layer

### A recall and synthesis engine, not a capture engine

The AI does not change how people capture. It makes what they've already captured retrievable and useful. Three core behaviours:

**Surface past context.** Before a meeting, surface relevant notes, decisions, and commitments from prior occurrences of the same event or series.

**Synthesise decisions.** Across a series of events, identify what was decided, what was deferred, and what was committed to — without the user having to re-read everything.

**Answer history.** Allow the user to ask questions about their own past — "what did I decide about X in Q1?" — and get a grounded, traceable answer.

---

## Design principles

**Quiet by default.** MyPKM stays out of the way. No notifications, no nudges, no dashboards demanding attention.

**Durable by design.** Plain Markdown. No proprietary format. Files readable in twenty years without MyPKM installed.

**Deliberate over automatic.** Promotion is manual. The system trusts the user's judgment about what matters and when.

**Time as truth.** The timeline is the single source of structure. No tags, no folders, no categories to maintain.

---

## What success looks like

Six months in, a user walks into a 1:1 with a direct report and already knows — without searching — what was discussed last month, what they committed to, and what's still unresolved. They didn't organise their way to that. Time did it for them.

That is the moment they can't go back.
