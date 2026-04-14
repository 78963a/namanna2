# Routine Management App 이라는것은 너의 희망사항.

A sophisticated, production-grade routine management application built with React, TypeScript, and Tailwind CSS. This app is designed to help users build and maintain healthy habits through structured routine groups, real-time tracking, and gamified progress.

## 🌟 Key Features

- **Routine Grouping**: Organize tasks into logical groups (e.g., Morning Routine, Evening Routine) with specific purposes and schedules.
- **Dynamic Scheduling**: Support for daily, weekly, monthly, and yearly routine execution.
- **Real-time Execution**: Interactive timer-based task execution with pause, resume, and "later" functionality.
- **Gamification**: Earn points for completing tasks and maintaining streaks.
- **Visual Progress**: Comprehensive statistics view with charts (using Recharts) to track wake-up times and point accumulation.
- **Responsive Design**: Polished, mobile-first UI with smooth animations (using Framer Motion).
- **Check-in System**: Daily wake-up check-in with bonus points for consistency.
- **Checklists**: Support for sub-tasks within individual routines.
- **Alarms**: Integrated alarm system to notify users when it's time to start a routine.

## 🛠️ Technical Architecture

The application follows a modular architecture for improved maintainability and scalability:

- **`src/types.ts`**: Centralized TypeScript interfaces and enums.
- **`src/constants.ts`**: Global configuration values and initial state.
- **`src/utils/`**: Modular utility functions for time calculations and task logic.
- **`src/components/common/`**: Reusable UI components (Header, Buttons, Modals).
- **`src/components/views/`**: Main application views (Home, Stats, Execution, Settings, Add).
- **`src/App.tsx`**: Main entry point managing global state and navigation.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📖 Usage

1. **Setup**: Go to the **Settings** tab to configure your target wake-up time and reset time.
2. **Create Routines**: Use the **Add** tab to create your first routine group. Start with a "Trigger" task (something very easy).
3. **Daily Check-in**: Check in every morning within your target window to earn bonus points and build your streak.
4. **Execute**: When it's time for a routine, go to the **Home** tab and click on a routine group to start the execution timer.
5. **Track**: Monitor your progress in the **Stats** tab.

## 📝 License

This project is licensed under the Apache-2.0 License.
