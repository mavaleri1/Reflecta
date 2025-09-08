import React, { useState } from "react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { MainScreen } from "./components/MainScreen";
import { DialogueScreen } from "./components/DialogueScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";
import { BottomNavigation } from "./components/BottomNavigation";
import { AuthScreen } from "./components/AuthScreen";
import DarkVeil from "./components/DarkVeil";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>("welcome");
  const [hasStarted, setHasStarted] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  
  const { user, loading } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      setHasStarted(true);
      setCurrentScreen("main");
    } else {
      setShowAuth(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setHasStarted(true);
    setCurrentScreen("main");
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleBack = () => {
    setCurrentScreen("main");
    //dont clear messages
    setAiResponse(null);
    setUserMessage(null);
  };

  //show loading while checking authentication
  if (loading) {
    return (
      <div className="reflecta-gradient min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  //show authentication screen
  if (showAuth) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  //show welcome screen if user is not authenticated
  if (!user && !hasStarted) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

return (
  <div className="min-h-screen relative">
    {/* background for the whole screen */}
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: -1 
    }}>
      <DarkVeil 
        hueShift={30}
        noiseIntensity={0.02}
        scanlineIntensity={0.1}
        speed={1}
        scanlineFrequency={2.0}
        warpAmount={0.1}
      />
    </div>
    
    <div className="max-w-md mx-auto relative min-h-screen">
        {currentScreen === "main" && (
        <MainScreen onNavigate={handleNavigate} onAiResponse={setAiResponse} onUserMessage={setUserMessage} />
      )}
        
        {currentScreen === "dialogue" && (
          <DialogueScreen onBack={handleBack} aiResponse={aiResponse} userMessage={userMessage} />
        )}
        
        {currentScreen === "history" && (
          <HistoryScreen onBack={handleBack} />
        )}
        
        {currentScreen === "analytics" && (
          <AnalyticsScreen onBack={handleBack} />
        )}

        {/* Bottom Navigation - show on all screens except dialogue */}
        {currentScreen !== "dialogue" && (
          <>
            <div className="pb-20 bg-[rgba(132,114,114,1)]">
              {/* This div adds bottom padding to prevent content from being hidden behind the navigation */}
            </div>
            <BottomNavigation 
              activeScreen={currentScreen} 
              onNavigate={handleNavigate} 
            />
          </>
        )}
      </div>
    </div>
  );
}