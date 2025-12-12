import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Camera, X, Sparkles, ChevronDown, Menu, Loader2, PanelLeftOpen } from 'lucide-react';
import { auth } from '../services/firebase'; 
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.alumnx.com/api/agrigpt';

const ConsultantPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(260); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Chat State
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState('Citrus Crop'); // Default
  const [currentChatId, setCurrentChatId] = useState(null); 
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-Clear Image on Context Change
  useEffect(() => {
    setSelectedImage(null);
    setImagePreview(null);
  }, [selectedContext]);

  // Mouse Drag Logic
  const startResizing = useCallback((e) => { e.preventDefault(); setIsResizing(true); }, []);
  const stopResizing = useCallback(() => { setIsResizing(false); }, []);
  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth < 150) { setIsSidebarOpen(false); setIsResizing(false); }
      else if (newWidth > 450) { setSidebarWidth(450); }
      else { setSidebarWidth(newWidth); if (!isSidebarOpen) setIsSidebarOpen(true); }
    }
  }, [isResizing, isSidebarOpen]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
      return () => { document.removeEventListener('mousemove', resize); document.removeEventListener('mouseup', stopResizing); };
    }
  }, [isResizing, resize, stopResizing]);

  // Context Suggestions
  const contextSuggestions = {
    'Citrus Crop': ["Help me identify citrus disease", "Best fertilizer for lemon trees", "How to control aphids?"],
    'Government Schemes': ["Show schemes for orange farmers", "PM-KISAN eligibility", "Crop insurance options"]
  };

  useEffect(() => {
    const handleResize = () => { setIsMobile(window.innerWidth < 768); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔥 Detect Forced Context from Routing
  useEffect(() => {
    if (location.state?.forcedContext) {
      setSelectedContext(location.state.forcedContext);
      setMessages([]); 
      setQuery(''); 
      setCurrentChatId(null);
    }
  }, [location.state]);

  // --- 🔥 SUBMIT LOGIC: CORRECT ENDPOINTS ---
  const handleSubmit = async (textOverride = null) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim() && !selectedImage) return;
    if (!user?.email) return alert("Please log in.");

    const tempUserMsg = { messageSource: 'user', message: textToSend, image: imagePreview, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);
    const currentQuery = textToSend;
    const currentImage = selectedImage;
    setQuery('');
    setImagePreview(null);
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // 1. Save User Msg
      const saveUserRes = await fetch(`${BACKEND_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, messageSource: 'user', message: textToSend, chatId: currentChatId })
      });
      if (!saveUserRes.ok) throw new Error("Save failed");
      const saveData = await saveUserRes.json();
      const activeChatId = saveData.chatId || currentChatId;
      if (!currentChatId) setCurrentChatId(activeChatId);

      // 2. Select Endpoint
      let endpoint = '/ask-consultant'; // Default
      
      // 🔥 Logic: Schemes vs Citrus vs Image
      if (selectedContext === 'Government Schemes') {
        endpoint = '/query-government-schemes';
      }
      else if (currentImage) {
        endpoint = '/ask-with-image'; 
      }

      console.log("Using Endpoint:", endpoint); // Debugging

      let aiRes;
      
      if (currentImage) {
        const formData = new FormData();
        formData.append('file', currentImage);
        formData.append('query', currentQuery || 'What disease does this crop have? and how can I treat it?');
        
        aiRes = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          body: formData
        });
      } else {
        aiRes = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: currentQuery })
        });
      }

      if (!aiRes.ok) throw new Error("AI Service failed");
      const aiData = await aiRes.json();
      const aiAnswer = aiData.answer || aiData.response || "Message processed.";

      // 3. Save AI Msg
      await fetch(`${BACKEND_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, messageSource: 'system', message: aiAnswer, chatId: activeChatId })
      });

      setMessages(prev => [...prev, { messageSource: 'system', message: aiAnswer, timestamp: new Date().toISOString() }]);

    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const startNewChat = () => {
    setMessages([]); setQuery(''); setCurrentChatId(null); 
    setSelectedImage(null); setImagePreview(null);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        width={sidebarWidth} 
        activeContext={selectedContext}
      />

      {/* Draggable Divider */}
      {isSidebarOpen && !isMobile && (
        <div onMouseDown={startResizing} className="w-1 bg-gray-100 hover:bg-green-300 cursor-col-resize transition-colors" />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-full bg-white relative transition-all duration-300 ${isSidebarOpen && !isMobile ? 'ml-0' : ''} min-w-0`}>

        {/* Header */}
        <header className="px-4 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">AgriGPT</h1>
          </div>
          
          {/* Context Selector */}
          <div className="relative">
            <button onClick={() => setIsContextOpen(!isContextOpen)} className="flex items-center gap-2 px-4 py-2 bg-white border border-green-500 text-green-700 rounded-full hover:bg-green-50 transition-all shadow-sm">
              <span className="font-medium text-sm">{selectedContext}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isContextOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isContextOpen && (
              <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-[200px] z-20">
                <button onClick={() => { setSelectedContext('Citrus Crop'); setIsContextOpen(false); startNewChat(); }} className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-sm text-gray-700 transition-colors">🍊 Citrus Crop</button>
                <button onClick={() => { setSelectedContext('Government Schemes'); setIsContextOpen(false); startNewChat(); }} className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-sm text-gray-700 transition-colors">🏛️ Government Schemes</button>
              </div>
            )}
          </div>

          {!isMobile && !isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Open Sidebar">
              <PanelLeftOpen className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </header>

        {/* Chat or Welcome */}
        <div className="flex-1 overflow-y-auto px-4 md:px-20 py-6 bg-gray-50/30">
          {messages.length === 0 ? (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center h-full text-center space-y-6 py-10">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome to AgriGPT</h2>
              <p className="text-gray-600 text-sm max-w-md">Ask questions about <span className="font-semibold text-green-600">{selectedContext}</span> or select a suggestion below.</p>
              
              <div className="flex flex-wrap gap-3 justify-center">
                {contextSuggestions[selectedContext].map((suggestion, idx) => (
                  <button key={idx} onClick={() => handleSubmit(suggestion)} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-green-500 hover:bg-green-50 transition-all shadow-sm">
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.messageSource === 'user' ? 'justify-end' : 'justify-start gap-3'}`}>
                  {msg.messageSource === 'system' && <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border border-green-200 shrink-0"><Sparkles className="w-4 h-4 text-green-600" /></div>}
                  
                  <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.messageSource === 'user' ? 'bg-white border border-gray-200 text-gray-800 rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                    {msg.image && <img src={msg.image} alt="User Upload" onClick={() => setExpandedImage(msg.image)} className="max-h-48 rounded-lg mb-2 object-cover border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity" />}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  
                  {msg.messageSource === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0"><span className="text-xs font-semibold text-gray-600">👤</span></div>}
                </div>
              ))}
              {isLoading && <div className="text-center text-xs text-gray-400 animate-pulse">AgriGPT is thinking...</div>}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-50 shrink-0">
          <div className="max-w-3xl mx-auto relative">
            
            {imagePreview && (
              <div className="absolute -top-16 left-0 bg-white p-2 rounded-lg shadow border flex items-center gap-2">
                <img src={imagePreview} className="w-10 h-10 rounded object-cover" alt="Preview" />
                <button onClick={() => {setImagePreview(null); setSelectedImage(null);}}><X className="w-4 h-4"/></button>
              </div>
            )}

            <div className="flex-1 bg-white border-2 border-green-500 rounded-3xl flex items-center px-2 transition-all shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-green-200/50">
                
                {selectedContext === 'Citrus Crop' && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <button onClick={() => fileInputRef.current.click()} className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors" title="Add Photo">
                      <Camera className="w-5 h-5"/>
                    </button>
                  </>
                )}

                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={handleKeyPress} placeholder={selectedContext === 'Government Schemes' ? "Ask about schemes..." : "Ask or upload photo..."} className="flex-1 bg-transparent border-none focus:ring-0 py-3.5 px-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none" />
                
                <button onClick={() => handleSubmit()} disabled={isLoading || (!query.trim() && !selectedImage)} className={`p-2 rounded-full transition-all duration-200 m-1 ${query.trim() || selectedImage ? 'bg-green-600 text-white shadow-md hover:bg-green-700 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full" onClick={(e) => e.stopPropagation()}>
            <Sidebar isOpen={true} toggleSidebar={() => setIsMobileMenuOpen(false)} width={256} activeContext={selectedContext} />
          </div>
        </div>
      )}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setExpandedImage(null)}>
          <img src={expandedImage} alt="Expanded" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default ConsultantPage;