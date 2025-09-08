
# Reflecta 
AI-powered evening journal for daily reflection, mood tracking, and weekly insights.

## 🚀 Features

- **Modern React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **Lucide React** icons
- **Recharts** for data visualization
- **Motion** for animations
- **Responsive Design** optimized for mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd reflecta
```

2. Install dependencies:
```bash
npm install
```

## 🚀 Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🏗️ Building for Production

Build the application for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

## 📱 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── figma/          # Figma-specific components
│   ├── MainScreen.tsx  # Main application screen
│   ├── WelcomeScreen.tsx
│   ├── DialogueScreen.tsx
│   ├── HistoryScreen.tsx
│   └── AnalyticsScreen.tsx
├── styles/             # Global styles
├── guidelines/         # Code guidelines and examples
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## 🎨 UI Components

This project includes a comprehensive set of UI components built with Radix UI:

- Accordion, Alert Dialog, Avatar
- Button, Card, Calendar
- Checkbox, Dialog, Dropdown Menu
- Form controls, Navigation, Progress
- Select, Slider, Switch, Tabs
- And many more...

## 📊 Data Visualization

The app includes chart components using Recharts for:
- Line charts
- Bar charts
- Area charts
- And other data visualization needs

## 🚀 Deployment

This project is configured for deployment on Vercel. The build output directory is set to `dist` in the Vite configuration.

## 📄 License