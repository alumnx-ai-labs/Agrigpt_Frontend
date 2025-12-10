import React, { useState, useRef, useEffect, useCallback } from 'react'; // <--- FIXED: Added useCallback
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Camera, X, Sparkles, Copy, CheckCircle2, ChevronDown } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase'; 
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { v4 as uuidv4 } from 'uuid';

const ConsultantPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- UI State ---
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState('Government Schemes');
  const [currentChatId, setCurrentChatId] = useState(null);
  
  // --- Chat State ---
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- 1. Load Chat (From Router or Fresh) ---
  useEffect(() => {
    if (location.state?.existingChat) {
      const chat = location.state.existingChat;
      setMessages(chat.messages || []);
      setCurrentChatId(chat.id);
      if (chat.type === 'citrus') setSelectedContext('Citrus Crop');
      else setSelectedContext('Government Schemes');
    } else {
      setMessages([]);
      setCurrentChatId(uuidv4());
    }
  }, [location.state]);

  // --- 2. Local Storage Helper ---
  const saveChatToLocal = useCallback((newMessages) => {
    if (!auth.currentUser) return;
    
    const stored = localStorage.getItem('agrigpt_chats');
    let chats = stored ? JSON.parse(stored) : [];
    
    const existingIndex = chats.findIndex(c => c.id === currentChatId);
    
    const chatData = {
      id: currentChatId,
      userId: auth.currentUser.uid,
      type: selectedContext === 'Citrus Crop' ? 'citrus' : 'schemes',
      title: newMessages.length > 0 ? newMessages[0].message.slice(0, 40) + "..." : "New Chat",
      messages: newMessages,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      chats[existingIndex] = chatData;
    } else {
      chats.unshift(chatData);
    }

    localStorage.setItem('agrigpt_chats', JSON.stringify(chats));
  }, [currentChatId, selectedContext]);

  // --- 3. Mock AI Logic ---
  const getMockAIResponse = (userQuery, context) => {
    if (context === 'Citrus Crop') {
      return "Based on the symptoms described, this appears to be Citrus Canker. I recommend removing infected twigs and applying a copper-based bactericide spray. Ensure you water the plant at the base to avoid wetting the foliage.";
    }
    return "The PM Kisan Samman Nidhi scheme provides ₹6,000 annually to eligible farmer families. The amount is released in three equal installments of ₹2,000 each directly into your bank account. You can check your status on the official pmkisan.gov.in portal.";
  };

  // --- 4. Handle Submit ---
  const handleSubmit = async (textOverride = null) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim() && !selectedImage) return;

    // User Message
    const userMsg = {
      type: 'user',
      message: textToSend,
      image: imagePreview,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveChatToLocal(updatedMessages);
    
    setQuery('');
    if (selectedImage) {
      setSelectedImage(null);
      setImagePreview(null);
    }
    
    setIsLoading(true);

    // Simulated AI Response
    setTimeout(() => {
      const aiResponse = {
        type: 'assistant',
        message: getMockAIResponse(textToSend, selectedContext),
        images: [],
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      saveChatToLocal(finalMessages);
      setIsLoading(false);
    }, 1500);
  };

  // --- Utilities ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const startNewChat = () => {
    if (messages.length > 0) {
        setMessages([]);
        setQuery('');
        setCurrentChatId(uuidv4());
        navigate('/consultant', { replace: true, state: {} });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const suggestions = selectedContext === 'Citrus Crop' ? [
    "Identify this yellowing leaf disease",
    "Best fertilizer for lemon trees?",
    "How to treat citrus canker?",
    "Watering schedule for sweet lime"
  ] : [
    "Am I eligible for PM Kisan?",
    "Subsidies for drip irrigation?",
    "How to apply for crop insurance?",
    "Loans for organic farming"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />

      <main className="flex-1 flex flex-col h-full bg-white relative">
        
        {/* --- FIXED DROPDOWN HEADER --- */}
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Context:</span>
            
            <div className="relative">
              {/* Trigger Button */}
              <button 
                onClick={() => setIsContextOpen(!isContextOpen)}
                className="flex items-center gap-2 font-semibold text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-transparent focus:border-green-200"
              >
                {selectedContext} 
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isContextOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Invisible Backdrop */}
              {isContextOpen && (
                <div 
                  className="fixed inset-0 z-10 cursor-default" 
                  onClick={() => setIsContextOpen(false)}
                ></div>
              )}

              {/* Dropdown Menu */}
              {isContextOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                  <button 
                    onClick={() => { setSelectedContext('Government Schemes'); startNewChat(); setIsContextOpen(false); }} 
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 ${selectedContext === 'Government Schemes' ? 'bg-green-50 text-green-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    <span className="text-lg">🏛️</span> Government Schemes
                  </button>
                  <button 
                    onClick={() => { setSelectedContext('Citrus Crop'); startNewChat(); setIsContextOpen(false); }} 
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 ${selectedContext === 'Citrus Crop' ? 'bg-orange-50 text-orange-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    <span className="text-lg">🍋</span> Citrus Crop Protection
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto pb-20">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${selectedContext === 'Citrus Crop' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                 <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">{selectedContext === 'Citrus Crop' ? 'Citrus Expert' : 'Scheme Advisor'}</h2>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg mt-8">
                {suggestions.map((text, idx) => (
                  <button key={idx} onClick={() => handleSubmit(text)} className="text-sm text-left p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/30 transition-all text-gray-600">{text}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-24">
              {messages.map((msg, index) => (
                <div key={index} className="animate-in fade-in slide-in-from-bottom-2">
                  <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'gap-4'}`}>
                    {msg.type === 'assistant' && <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-lg">🤖</div>}
                    <div className={`${msg.type === 'user' ? 'bg-gray-100 max-w-[85%]' : 'flex-1'} px-5 py-3 rounded-2xl ${msg.type === 'user' ? 'rounded-tr-sm' : ''}`}>
                      {msg.image && <img src={msg.image} className="max-h-48 rounded-lg mb-2 object-cover" alt="User upload" />}
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-center text-gray-400 text-sm animate-pulse">Thinking...</div>}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/90 backdrop-blur border-t border-gray-100 shrink-0">
          <div className="max-w-3xl mx-auto relative">
            {imagePreview && (
              <div className="absolute -top-16 left-0 bg-white p-2 rounded-lg shadow border flex items-center gap-2">
                <img src={imagePreview} className="w-10 h-10 rounded object-cover" alt="Preview" />
                <button onClick={() => {setImagePreview(null); setSelectedImage(null);}}><X className="w-4 h-4"/></button>
              </div>
            )}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex items-end p-2 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all">
               {selectedContext === 'Citrus Crop' && (
                 <>
                   <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                   <button onClick={() => fileInputRef.current.click()} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><Camera className="w-5 h-5"/></button>
                 </>
               )}
               <textarea 
                 name="chatQuery" 
                 id="chatInput" 
                 value={query} 
                 onChange={e => setQuery(e.target.value)} 
                 onKeyPress={handleKeyPress} 
                 placeholder={`Message AgriGPT (${selectedContext})...`} 
                 className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2.5 px-3 text-sm" 
                 rows={1} 
               />
               <button onClick={() => handleSubmit()} disabled={isLoading} className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"><Send className="w-4 h-4" /></button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">AI can make mistakes. Verify important info.</p>
          </div>
        </div>

      </main>
      
      {expandedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} className="max-h-[90vh] rounded-lg" alt="Full" />
        </div>
      )}
    </div>
  );
};

export default ConsultantPage;