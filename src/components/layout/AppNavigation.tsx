import { Link, useLocation } from "react-router-dom";
import { Heart, MessageCircle, Calendar, Search, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const AppNavigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  if (!user) return null;

  const navItems = [
    { path: '/discover', icon: Search, label: 'DISCOVER' },
    { path: '/matches', icon: Heart, label: 'MATCHES' },
    { path: '/events', icon: Calendar, label: 'EVENTS' },
    { path: '/profile', icon: User, label: 'PROFILE' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black z-50">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex-1 p-3 text-center border-r-4 border-black last:border-r-0 ${
                isActive(item.path) ? 'bg-brutal-pink' : 'bg-white hover:bg-gray-100'
              }`}
            >
              <Icon className={`h-6 w-6 mx-auto mb-1 ${
                isActive(item.path) ? 'text-black' : 'text-gray-600'
              }`} />
              <div className={`text-xs font-black ${
                isActive(item.path) ? 'text-black' : 'text-gray-600'
              }`}>
                {item.label}
              </div>
            </Link>
          );
        })}
        <button 
          onClick={handleLogout}
          className="flex-1 p-3 text-center bg-red-500 hover:bg-red-600 text-white"
        >
          <LogOut className="h-6 w-6 mx-auto mb-1" />
          <div className="text-xs font-black">LOGOUT</div>
        </button>
      </div>
    </nav>
  );
};