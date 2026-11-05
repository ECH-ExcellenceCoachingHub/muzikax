'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useAIAssistant } from '../contexts/AIAssistantContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tracks?: any[];
}

const AIMusicAssistant: React.FC = () => {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "🎵 Hello! I'm your MuzikaX AI music assistant. I can help you discover amazing Rwandan and African music based on your mood, preferences, or any specific request. What would you like to listen to today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [addingToQueue, setAddingToQueue] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playTrack, addToQueue } = useAudioPlayer();
  const { isAssistantOpen, openAssistant, closeAssistant, toggleAssistant } = useAIAssistant();
  const { user, isAuthenticated } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsMinimized(false);
    closeAssistant();
  };

  useEffect(() => {
    if (isAssistantOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isAssistantOpen]);

  const handleLoginRequired = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const handleNavigateToLogin = () => {
    window.location.href = '/login';
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      // Check if login is required
      if (data.loginRequired && !isAuthenticated) {
        setShowLoginPrompt(true);
        const loginMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.loginMessage || "This feature requires you to be logged in. Would you like to login now?",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, loginMessage]);
        setIsLoading(false);
        return;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || "I found some great tracks for you!",
        timestamp: new Date(),
        tracks: data.recommendations?.foundTracks || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-play first recommended track if available
      if ((data.action === 'play' || data.action === 'recommend') && data.recommendations?.foundTracks?.length > 0) {
        // Transform track data to match audio player format (audioURL -> audioUrl)
        const transformedTracks = data.recommendations.foundTracks.map((track: any) => ({
          ...track,
          id: track._id || track.id, // Ensure id field is set for play count tracking
          audioUrl: track.audioURL, // Convert audioURL to audioUrl for audio player compatibility
          artist: track.artist?.name || track.creatorId?.name || 'Unknown Artist',
          creatorId: track.creatorId?._id || track.artist?._id || track.creatorId,
          coverImage: track.coverURL || track.coverArt || track.coverImage
        }));

        // Play the first track immediately
        playTrack(transformedTracks[0]);
        
        // Add a note about what's playing and queued
        const totalTracks = transformedTracks.length;
        if (totalTracks > 1) {
          const queueNote: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `▶️ Now playing: "${transformedTracks[0].title}" by ${transformedTracks[0].artist}\n\n🎵 Added ${totalTracks - 1} more tracks to queue`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, queueNote]);
        } else {
          const playingNote: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `▶️ Now playing: "${transformedTracks[0].title}" by ${transformedTracks[0].artist}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, playingNote]);
        }
      }
      
      // Handle playlist creation request
      if (data.action === 'require_login' && data.playlistCreation) {
        // This will be handled by the login prompt
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please make sure the backend server is running and the Gemini API key is configured.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      sendMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isAssistantOpen) {
    return (
      <button
        onClick={() => {
          // Reset minimized state when reopening
          setIsMinimized(false);
          openAssistant();
        }}
        className="fixed bottom-20 sm:bottom-28 right-4 sm:right-6 z-[9999] bg-gradient-to-r from-primary to-primary-light text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110 active:scale-95 group touch-manipulation"
        aria-label="Open AI Music Assistant"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="relative">
          <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-gray-900"></div>
        </div>
        {/* Tooltip - only show on desktop */}
        <span className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm font-semibold border border-primary/30">
          🎵 MuzikaX AI Assistant
          {/* Arrow pointing down */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
        </span>
      </button>
    );
  }

  return (
    <>
      {/* Floating Chat Window - Mobile-First Responsive Design */}
      <div 
        className={`fixed left-0 right-0 sm:right-4 sm:left-auto ${
          isMinimized ? 'z-[9997]' : 'z-[9999]'
        } ${
          isMinimized 
            ? 'bottom-20 sm:bottom-28' 
            : 'bottom-0 sm:bottom-24'
        } ${
          isMinimized 
            ? 'w-auto mx-4 sm:w-96' 
            : 'w-full sm:w-96'
        } ${
          isMinimized 
            ? 'h-auto' 
            : 'h-[85vh] sm:max-h-[600px]'
        } bg-surface-elevated border border-border-medium rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header - Larger touch targets for mobile */}
        <div className="bg-gradient-to-r from-primary to-primary-light p-3 sm:p-4 flex items-center justify-between flex-shrink-0">
          <div 
            className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
            onClick={handleMinimize}
            title={isMinimized ? "Click to maximize" : "Click to minimize"}
          >
            <div className="bg-white/20 p-2 rounded-full flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate text-text-primary">MuzikaX AI Assistant</h3>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {isMinimized && (
              <button
                onClick={handleMaximize}
                className="text-white/80 hover:text-white transition-colors p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 touch-manipulation"
                aria-label="Maximize"
                title="Maximize"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            )}
            {!isMinimized && (
              <button
                onClick={handleMinimize}
                className="text-white/80 hover:text-white transition-colors p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 touch-manipulation"
                aria-label="Minimize"
                title="Minimize"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 touch-manipulation"
              aria-label="Close chat"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages - Hidden when minimized */}
        {!isMinimized && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-900/50 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-primary-light text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                  {formatTime(message.timestamp)}
                </p>

                {/* Track Recommendations */}
                {message.tracks && message.tracks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-white/70 font-medium">
                        {message.tracks.length} track{message.tracks.length > 1 ? 's' : ''} found
                      </p>
                      {message.tracks.length > 1 && (
                        <button
                          onClick={() => {
                            // Play first track and queue the rest in order
                            if (message.tracks && message.tracks.length > 0) {
                              setAddingToQueue(true);
                              
                              // Transform all tracks to match audio player format
                              const transformedTracks = message.tracks.map((track) => ({
                                ...track,
                                id: track._id || track.id, // Ensure id field is set for play count tracking
                                audioUrl: track.audioURL,
                                artist: track.artist?.name || track.creatorId?.name || 'Unknown Artist',
                                creatorId: track.creatorId?._id || track.artist?._id,
                                coverImage: track.coverURL || track.coverArt
                              }));
                              
                              // Play the first track
                              playTrack(transformedTracks[0]);
                              
                              // Add remaining tracks to queue in order
                              transformedTracks.slice(1).forEach((track, index) => {
                                // Add each track with a small stagger to maintain order
                                setTimeout(() => {
                                  addToQueue(track);
                                  // Show completion when last track is added
                                  if (index === transformedTracks.slice(1).length - 1) {
                                    setAddingToQueue(false);
                                  }
                                }, index * 50); // 50ms delay between each track to maintain order
                              });
                            }
                          }}
                          disabled={addingToQueue}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            addingToQueue 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                              : 'bg-primary/20 text-primary hover:bg-primary/30'
                          }`}
                        >
                          {addingToQueue ? '⏳ Adding...' : '▶️ Play All'}
                        </button>
                      )}
                    </div>
                    {message.tracks.map((track, index) => (
                      <div
                        key={index}
                        className="rounded-lg p-3 cursor-pointer group mx-surface"
                        onClick={() => {
                          // Transform track data to match audio player format
                          const trackToPlay = {
                            ...track,
                            id: track._id || track.id, // Ensure id field is set for play count tracking
                            audioUrl: track.audioURL,
                            artist: track.artist?.name || track.creatorId?.name || 'Unknown Artist',
                            creatorId: track.creatorId?._id || track.artist?._id,
                            coverImage: track.coverURL || track.coverArt
                          };
                          playTrack(trackToPlay);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">{track.title}</p>
                            <p className="text-xs text-white/70 truncate">{track.artist?.name || 'Unknown Artist'}</p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-primary-light" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
        )}

        {/* Quick Actions - Hidden when minimized */}
        {!isMinimized && (
          <div className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-800/50 border-t border-gray-700/50 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleQuickAction("Play calm Rwandan songs for studying")}
              className="flex-shrink-0 px-3 py-2 sm:py-1.5 bg-primary/20 text-primary rounded-full text-xs font-medium hover:bg-primary/30 transition-colors active:scale-95 touch-manipulation"
            >
              📚 Study Music
            </button>
            <button
              onClick={() => handleQuickAction("Give me trending Afrobeat in Kigali")}
              className="flex-shrink-0 px-3 py-2 sm:py-1.5 bg-primary-light/20 text-primary-light rounded-full text-xs font-medium hover:bg-primary-light/30 transition-colors active:scale-95 touch-manipulation"
            >
              🔥 Trending Now
            </button>
            <button
              onClick={() => handleQuickAction("Find songs like The Ben but faster")}
              className="flex-shrink-0 px-3 py-2 sm:py-1.5 bg-primary/20 text-primary rounded-full text-xs font-medium hover:bg-primary/30 transition-colors active:scale-95 touch-manipulation"
            >
              🎤 Similar Artists
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => sendMessage("Create a playlist for me")}
                className="flex-shrink-0 px-3 py-2 sm:py-1.5 bg-primary-light/20 text-primary-light rounded-full text-xs font-medium hover:bg-primary-light/30 transition-colors active:scale-95 touch-manipulation flex items-center space-x-1"
              >
                <span>🎵</span>
                <span>Create Playlist</span>
                <span className="text-[10px] opacity-70">(Login)</span>
              </button>
            )}
          </div>
        </div>
        )}

        {/* Input Area - Hidden when minimized */}
        {!isMinimized && (
          <div className="p-3 sm:p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`p-3 rounded-full transition-colors flex-shrink-0 ${
                isListening
                  ? 'bg-primary text-white animate-pulse'
                  : 'bg-gray-700 text-gray-300 hover:bg-primary hover:text-white'
              } active:scale-95 touch-manipulation`}
              aria-label="Voice input"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
              placeholder="Ask me anything about music..."
              className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 touch-manipulation flex-shrink-0"
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl shadow-2xl max-w-sm w-full border border-primary/30 p-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-primary">Login Required</h3>
            </div>

            <p className="text-gray-300 text-sm mb-4">
              Unlock the full MuzikaX AI experience:
            </p>

            <ul className="space-y-2 mb-5">
              <li className="flex items-start space-x-2 text-gray-300 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Create AI playlists</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-300 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Save history</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-300 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Smart recommendations</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-300 text-sm">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Access anywhere</span>
              </li>
            </ul>

            <div className="flex gap-2">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Later
              </button>
              <button
                onClick={handleNavigateToLogin}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all transform hover:scale-105"
              >
                Login 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIMusicAssistant;
