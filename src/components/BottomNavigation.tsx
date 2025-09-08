import { Home, MessageCircle, Calendar, BarChart3 } from "lucide-react";

interface BottomNavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

export function BottomNavigation({ activeScreen, onNavigate }: BottomNavigationProps) {
  const navItems = [
    { id: 'main', icon: Home, label: 'Home' },
    { id: 'dialogue', icon: MessageCircle, label: 'Chat' },
    { id: 'history', icon: Calendar, label: 'History' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-all ${
                isActive 
                  ? 'text-white bg-white/10' 
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}