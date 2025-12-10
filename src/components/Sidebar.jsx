import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Sprout, 
  Landmark, 
  LogOut, 
  User, 
  PanelLeftClose, 
  PanelLeftOpen 
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

const Sidebar = ({ isOpen = true, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login', { replace: true });
    } catch (e) {
      console.warn('Sign out error', e);
    }
  };

  // Helper to check if we are currently on that page (for highlighting)
  const isActive = (path) => location.pathname.includes(path);

  return (
    <aside 
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-[#F9FAFB] border-r border-gray-200 h-screen flex flex-col flex-shrink-0 font-sans transition-all duration-300 ease-in-out relative z-20`}
    >
      
      {/* 1. Top Section: Logo, Toggle, New Chat */}
      <div className="p-4 flex flex-col gap-4">
        
        {/* Header Row */}
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} mb-2`}>
          {isOpen && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-lg">
                🌾
              </div>
              <span className="font-bold text-gray-700 tracking-tight">AgriGPT</span>
            </div>
          )}
          
          <button 
            onClick={toggleSidebar}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            title={isOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            {isOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={() => navigate('/consultant')}
          className={`flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 rounded-xl shadow-sm transition-all duration-200 group ${
            isOpen ? 'px-4 py-3 w-full' : 'p-3 w-10 h-10 mx-auto'
          }`}
          title="New Chat"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {isOpen && <span className="text-sm font-medium whitespace-nowrap">New Chat</span>}
        </button>
      </div>

      {/* 2. Middle Section: Navigation Links (THE FIX IS HERE) */}
      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-hide">
        {isOpen && (
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 animate-in fade-in">
            Recent Chats
          </h3>
        )}

        <div className="space-y-1">
          {/* Button 1: Government Schemes History */}
          <button
            onClick={() => navigate('/recents/schemes')} // <--- NOW NAVIGATES
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-200 group ${
              isActive('schemes')
                ? 'bg-green-100/50 text-green-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            } ${!isOpen && 'justify-center'}`}
            title={!isOpen ? "Govt Schemes History" : ""}
          >
            <Landmark className={`w-5 h-5 flex-shrink-0 ${isActive('schemes') ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            {isOpen && <span className="truncate">Govt Schemes</span>}
          </button>

          {/* Button 2: Citrus Crop History */}
          <button
            onClick={() => navigate('/recents/citrus')} // <--- NOW NAVIGATES
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-200 group ${
              isActive('citrus')
                ? 'bg-orange-100/50 text-orange-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            } ${!isOpen && 'justify-center'}`}
            title={!isOpen ? "Citrus History" : ""}
          >
            <Sprout className={`w-5 h-5 flex-shrink-0 ${isActive('citrus') ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            {isOpen && <span className="truncate">Citrus Protection</span>}
          </button>
        </div>
      </div>

      {/* 3. Bottom Section: User Profile */}
      <div className="p-4 border-t border-gray-200 bg-[#F9FAFB]">
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center flex-col gap-4'}`}>
          
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 cursor-default">
              {user?.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
            </div>
            
            {isOpen && (
              <div className="flex-col flex overflow-hidden animate-in fade-in">
                <span className="text-xs font-semibold text-gray-700 truncate w-24">
                  {user?.displayName || 'Farmer'}
                </span>
                <span className="text-[10px] text-gray-400 truncate w-24">
                  {user?.email}
                </span>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleSignOut}
            className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;