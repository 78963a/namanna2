# 단하루 (Danharu) - Premium Routine Management

**단하루 (Danharu)** is a sophisticated, production-grade routine management application designed to help users build and maintain life-changing habits. Built with a focus on precision, motivation, and seamless user experience, it transforms abstract goals into actionable, timed sequences.

## 🌟 Key Features

### 1. Smart Routine Grouping
- **Logical Organization**: Group tasks into focused blocks like "Morning Routine," "Work Focus," or "Evening Wind-down."
- **Flexible Scheduling**: Assign routines to specific days of the week.
- **Contextual Starts**: Choose between fixed-time starts, situational triggers, or anytime execution.

### 2. Interactive Execution Engine
- **Active Timer Tracking**: Real-time monitoring of task duration with a polish focused on the "now."
- **Dynamic Task Control**: Pause, resume, skip, or defer ("later") tasks on the fly.
- **Checklist Support**: Manage sub-tasks within any routine for granular control.

### 3. Data-Driven Insights
- **Performance Analytics**: Track 7-day and 30-day success averages for groups and individual tasks.
- **Time Analysis**: Monitor accumulated time spent on habits versus target durations.
- **Visual Activity Log**: A unique "TimeBar" visualizes your daily rhythm and task density.
- **Wake-up Consistency**: Dedicated tracking for wake-up times and window-based rewards.

### 4. Advanced Motivation & UX
- **Gamified Progress**: Earn streaks and celebrate milestones with high-quality animations and confetti.
- **Dynamic Phrases**: Context-aware motivational messages that use complex Korean particle (Josa) logic for natural sounding encouragement.
- **Voice Guidance**: Integrated Text-to-Speech (TTS) to guide you through tasks hands-free.
- **Modern UI**: A responsive, mobile-first design powered by Framer Motion for smooth transitions and gesture-based interactions (like "Slide to Reset").

### 5. Robust Infrastructure
- **PWA Ready**: Optimized for mobile usage and home screen installation.
- **Cloud Sync**: Optional Firebase integration for cross-device data persistence.
- **Secure Backups**: Advanced export/import functionality featuring iOS Web Share API support for seamless data portability.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animation**: motion (Framer Motion)
- **Data Viz**: Recharts, D3
- **Icons**: Lucide React
- **Persistence**: LocalStorage / Firebase (Cloud Firestore & Auth)
- **State Management**: React Hooks (useState, useMemo, useEffect)
- **Drag & Drop**: @dnd-kit

## 📖 Usage Guide

1. **Initialize**: Set your target wake-up time and the hour your day "resets" in the Settings.
2. **Design**: Create your first routine group in the **Add** tab. We recommend starting with a small "Trigger" task.
3. **Check-In**: Start your day by checking in to log your wake-up time.
4. **Execute**: Launch a routine from the Home dashboard. Follow the timer and checklists to completion.
5. **Analyze**: Use the Stats tab to identify patterns and optimize your time allocation.

## 📝 License

This project is licensed under the Apache-2.0 License.
