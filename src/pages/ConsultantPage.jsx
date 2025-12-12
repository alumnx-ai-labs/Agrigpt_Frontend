import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Camera, X, Sparkles, ChevronDown, Menu, Loader2, PanelLeftOpen, Paperclip } from 'lucide-react';
import { auth } from '../services/firebase'; 
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ReactMarkdown from 'react-markdown';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.alumnx.com/api/agrigpt';

const ConsultantPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarWidth, setSidebarWidth] = useState(260); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [isContextOpen, setIsContextOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState('Citrus Crop'); 
  const [currentChatId, setCurrentChatId] = useState(null); 
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setSelectedImage(null);
    setImagePreview(null);
  }, [selectedContext]);

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
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (location.state?.forcedContext) {
      setSelectedContext(location.state.forcedContext);
      setMessages([]);
      setCurrentChatId(null);
    } 
    else if (location.state?.existingChat) {
      const chat = location.state.existingChat;
      setMessages(chat.messages || []);
      setCurrentChatId(chat.chatId);
      if (chat.messages?.length > 0) {
        const first = chat.messages[0].message.toLowerCase();
        if (first.includes('scheme') || first.includes('subsidy') || first.includes('fund')) {
          setSelectedContext('Government Schemes');
        } else {
          setSelectedContext('Citrus Crop');
        }
      }
    } else {
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [location.state]);

  // --- 🔥 SUBMIT LOGIC ---
  const handleSubmit = async (textOverride = null) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim() && !selectedImage) return;
    if (!user?.email) return alert("Please log in.");

    const fileToSend = selectedImage; 
    const base64Preview = imagePreview; 

    // 🔥 SAFE DB MESSAGE: Save File Name instead of Base64 Image
    // This prevents the "Request Entity Too Large" error in the DB history
    const fileName = fileToSend ? fileToSend.name : "Image";
    const messageForDB = fileToSend 
        ? `**[📎 Attached: ${fileName}]**\n\n${textToSend}` 
        : textToSend;

    // UI Optimistic Update (Show actual image here because we have it in RAM)
    const tempUserMsg = { 
        messageSource: 'user', 
        message: textToSend, // Show text
        image: base64Preview, // Show image locally
        timestamp: new Date().toISOString() 
    };
    
    setMessages(prev => [...prev, tempUserMsg]);
    setQuery('');
    setImagePreview(null);
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // 1. SAVE TO DB (Sending Text + Filename)
      const userPayload = {
        email: user.email,
        messageSource: 'user',
        message: messageForDB, // Saves "Attached: leaf.jpg"
        chatId: currentChatId
      };

      const saveUserRes = await fetch(`${BACKEND_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload)
      });

      if (!saveUserRes.ok) throw new Error("Failed to save user message");
      const saveData = await saveUserRes.json();
      const activeChatId = saveData.chatId || currentChatId;
      if (!currentChatId) setCurrentChatId(activeChatId);

      // 2. SEND TO AI (Send Real File)
      let endpoint = '/ask-consultant'; 
      let aiResponse;

      if (fileToSend) {
          endpoint = '/ask-with-image';
          const formData = new FormData();
          formData.append('query', textToSend);
          formData.append('file', fileToSend); 

          aiResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
              method: 'POST',
              body: formData 
          });
      } 
      else {
          if (selectedContext === 'Government Schemes') endpoint = '/query-government-schemes';
          
          aiResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: textToSend })
          });
      }

      if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          throw new Error(`AI Service failed (${aiResponse.status}): ${errText}`);
      }
      
      const aiData = await aiResponse.json();
      const aiAnswer = aiData.answer || aiData.response || "Message processed.";

      // 3. SAVE AI RESPONSE
      await fetch(`${BACKEND_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: user.email, 
            messageSource: 'system', 
            message: aiAnswer, 
            chatId: activeChatId 
        })
      });

      setMessages(prev => [...prev, { 
          messageSource: 'system', 
          message: aiAnswer, 
          timestamp: new Date().toISOString() 
      }]);

    } catch (error) {
      console.error("Chat Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        alert("File too large! Please upload an image smaller than 2MB.");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const startNewChat = () => { setMessages([]); setQuery(''); setCurrentChatId(null); };
  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };
  const suggestions = selectedContext === 'Citrus Crop' ? ["Identify this yellowing leaf", "Best fertilizer for lemon trees?", "How to treat citrus canker?"] : ["Am I eligible for PM Kisan?", "Subsidies for drip irrigation?", "Crop insurance application?"];
  const activeContext = selectedContext === 'Government Schemes' ? 'schemes' : 'citrus';
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  return (
    <div className="flex h-screen bg-white overflow-hidden select-none">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} width={sidebarWidth} isMobile={isMobile} isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} activeContext={activeContext} />
      {!isMobile && isSidebarOpen && <div className={`w-1 hover:w-1.5 cursor-col-resize z-30 transition-all flex items-center justify-center group ${isResizing ? 'bg-green-500 w-1.5' : 'bg-transparent hover:bg-gray-200'}`} onMouseDown={startResizing}><div className={`h-8 w-1 rounded-full ${isResizing ? 'bg-white' : 'bg-gray-300 opacity-0 group-hover:opacity-100'}`} /></div>}

      <main className="flex-1 flex flex-col h-full bg-white relative min-w-0">
        <header className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && !isMobile && <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-500"><PanelLeftOpen className="w-5 h-5" /></button>}
            {isMobile && <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-600"><Menu className="w-6 h-6" /></button>}
            <div className="relative">
              <button onClick={() => setIsContextOpen(!isContextOpen)} className="flex items-center gap-2 font-semibold text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-transparent focus:border-green-200 text-sm md:text-base">{selectedContext} <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isContextOpen ? 'rotate-180' : ''}`} /></button>
              {isContextOpen && (
                <>
                  <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsContextOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                    <button onClick={() => { setSelectedContext('Government Schemes'); startNewChat(); setIsContextOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 ${selectedContext === 'Government Schemes' ? 'bg-green-50 text-green-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>🏛️ Government Schemes</button>
                    <button onClick={() => { setSelectedContext('Citrus Crop'); startNewChat(); setIsContextOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 ${selectedContext === 'Citrus Crop' ? 'bg-orange-50 text-orange-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>🍋 Citrus Crop Protection</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto pb-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${selectedContext === 'Citrus Crop' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}><Sparkles className="w-8 h-8" /></div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">{selectedContext === 'Citrus Crop' ? 'Citrus Expert' : 'Scheme Advisor'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-8">{suggestions.map((text, idx) => (<button key={idx} onClick={() => handleSubmit(text)} className="text-sm text-left p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/30 transition-all text-gray-600">{text}</button>))}</div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div key={index} className="animate-in fade-in slide-in-from-bottom-2">
                  <div className={`flex ${msg.messageSource === 'user' ? 'justify-end' : 'gap-4'}`}>
                    {msg.messageSource === 'system' && <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-lg hidden sm:flex">🤖</div>}
                    <div className={`${msg.messageSource === 'user' ? 'bg-gray-100 max-w-[90%]' : 'flex-1'} px-4 py-3 sm:px-5 sm:py-3 rounded-2xl ${msg.messageSource === 'user' ? 'rounded-tr-sm' : ''}`}>
                      
                      {/* Show Local Image if available */}
                      {msg.image && (
                        <div onClick={() => setExpandedImage(msg.image)} className="cursor-zoom-in">
                            <img src={msg.image} className="max-h-64 rounded-lg mb-3 object-cover shadow-sm border border-gray-200" alt="User upload" />
                        </div>
                      )}
                      
                      <div className="text-gray-800 text-sm leading-relaxed overflow-hidden markdown-content">
                        <ReactMarkdown components={{
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold my-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold my-2" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                            a: ({node, ...props}) => <a className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                          }}>
                          {msg.message}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-center text-gray-400 text-sm animate-pulse flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> AI is thinking...</div>}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 bg-white/90 backdrop-blur border-t border-gray-50 shrink-0">
          <div className="max-w-3xl mx-auto relative">
            {imagePreview && <div className="absolute -top-16 left-0 bg-white p-2 rounded-lg shadow border flex items-center gap-2"><img src={imagePreview} className="w-10 h-10 rounded object-cover" alt="Preview" /><button onClick={() => {setImagePreview(null); setSelectedImage(null);}}><X className="w-4 h-4"/></button></div>}
            <div className="bg-white border-2 border-green-500 rounded-3xl flex items-end p-2 transition-all shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-green-200/50">
               {selectedContext === 'Citrus Crop' && (<><input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" /><button onClick={() => fileInputRef.current.click()} className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"><Camera className="w-5 h-5"/></button></>)}
               <textarea name="chatQuery" id="chatInput" value={query} onChange={e => setQuery(e.target.value)} onKeyPress={handleKeyPress} placeholder={`Message AgriGPT (${selectedContext})...`} className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2.5 px-3 text-sm text-gray-800 placeholder:text-gray-400" rows={1} />
               <button onClick={() => handleSubmit()} disabled={isLoading || (!query.trim() && !selectedImage)} className={`p-2.5 rounded-full transition-all duration-200 ${query.trim() || selectedImage ? 'bg-green-600 text-white shadow-md hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><Send className="w-4 h-4" /></button>
            </div>
            <p className="text-center text-[10px] text-gray-300 mt-2 hidden sm:block">AI can make mistakes. Verify important info.</p>
          </div>
        </div>
      </main>
      {expandedImage && <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setExpandedImage(null)}><img src={expandedImage} className="max-h-[90vh] rounded-lg" alt="Full" /></div>}
    </div>
  );
};

export default ConsultantPage;