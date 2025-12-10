import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Calendar, ChevronRight, Search } from 'lucide-react';
import { auth } from '../services/firebase';
import Sidebar from '../components/Sidebar';

const RecentChats = () => {
  const { category } = useParams(); 
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // READ LOCAL STORAGE
    const stored = localStorage.getItem('agrigpt_chats');
    if (stored) {
      const allChats = JSON.parse(stored);
      // Filter by current logged in user AND category
      const userId = auth.currentUser?.uid;
      
      const filtered = allChats.filter(chat => 
        chat.userId === userId && 
        (category === 'citrus' ? chat.type === 'citrus' : chat.type === 'schemes')
      );
      setChats(filtered);
    }
  }, [category]);

  const handleChatClick = (chat) => {
    navigate('/consultant', { state: { existingChat: chat } });
  };

  const filteredChats = chats.filter(chat => 
    (chat.title || "Untitled").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{category === 'citrus' ? 'Citrus Crop' : 'Government Schemes'} History</h1>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">{chats.length} chats</span>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" name="search" autoComplete="off" placeholder="Search your chats..." className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-green-500/20 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {filteredChats.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500">No recent chats found locally.</p>
              <button onClick={() => navigate('/consultant')} className="mt-4 text-green-600 font-medium hover:underline">Start a new chat</button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredChats.map((chat, idx) => (
                <div key={idx} onClick={() => handleChatClick(chat)} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-md cursor-pointer transition-all group flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${category === 'citrus' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}><MessageSquare className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-green-700">{chat.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400"><Calendar className="w-3 h-3" /><span>{new Date(chat.updatedAt).toLocaleDateString()}</span></div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecentChats;