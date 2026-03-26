import React, { useState, useEffect, useRef } from 'react';
import { Card, Input } from '../components/UI';
import { Send, Search, MoreVertical, Plus, MessageSquare, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { useApp } from '../context';
import { useSocket } from '../hooks/useSocket';
import API from '../api';

export const Chat = () => {
  const { user } = useApp();
  const { socket, onlineUsers, joinConversation, sendMessage, markRead } = useSocket(user?.id);
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showUsersList, setShowUsersList] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      API.get(`/chat/conversations/${user.id}`).then(res => {
        setConversations(res.data);
      }).catch(err => console.error("Failed to load conversations:", err));
    }
  }, [user?.id]);

  useEffect(() => {
    if (showUsersList && user?.id && availableUsers.length === 0) {
      API.get(`/chat/users/${user.id}`).then(res => {
        setAvailableUsers(res.data);
      }).catch(err => console.error("Failed to fetch users:", err));
    }
  }, [showUsersList, user?.id]);

  useEffect(() => {
    if (selectedChatId) {
      API.get(`/chat/${selectedChatId}/messages`).then(res => {
        setMessages(res.data);
         // Mark unread messages as read
         if (res.data.some((m: any) => !m.isRead && m.senderId !== user?.id)) {
           markRead(selectedChatId);
         }
      }).catch(err => console.error("Failed to load messages:", err));
      
      joinConversation(selectedChatId);
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleReceiveMessage = (msg: any) => {
      let isForActiveChat = false;
      
      setMessages(prev => {
        const isCurrentChat = prev.length > 0 ? prev[0].conversationId === msg.conversationId : msg.conversationId === selectedChatId;
        if (isCurrentChat || msg.conversationId === selectedChatId) {
           isForActiveChat = true;
           return [...prev, msg];
        }
        return prev;
      });
      
      if (isForActiveChat && msg.senderId !== user?.id) {
         markRead(msg.conversationId);
      }
      
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversationId);
        if (idx !== -1) {
          const updated = [...prev];
          const newMsgList = [msg, ...updated[idx].messages.filter((m: any) => m.id !== msg.id)];
          updated[idx] = { ...updated[idx], messages: newMsgList, updatedAt: msg.createdAt };
          const [moved] = updated.splice(idx, 1);
          updated.unshift(moved);
          return updated;
        } else {
          if (user?.id) {
             API.get(`/chat/conversations/${user.id}`).then(res => setConversations(res.data));
          }
        }
        return prev;
      });
    };

    const handleMessagesRead = ({ conversationId }: any) => {
       setMessages(prev => prev.map(m => m.conversationId === conversationId ? { ...m, isRead: true } : m));
       setConversations(prev => prev.map(c => {
          if (c.id === conversationId) {
             return {
                ...c,
                messages: c.messages.map((m: any) => ({ ...m, isRead: true }))
             };
          }
          return c;
       }));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, selectedChatId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedChatId || !user?.id) return;
    sendMessage(selectedChatId, user.id, newMessage);
    
    // Optimistically mark any unread messages from the other user as read implicitly if we replied
    markRead(selectedChatId);
    setNewMessage('');
  };

  const startNewChat = async (otherUserId: string) => {
    if (!user?.id || isStartingChat) return;
    setIsStartingChat(true);
    try {
      const res = await API.post('/chat/conversations', {
        user1Id: user.id,
        user2Id: otherUserId
      });
      const newConv = res.data;
      
      setConversations(prev => {
        if (!prev.find(c => c.id === newConv.id)) {
          return [newConv, ...prev];
        }
        return prev;
      });
      
      setSelectedChatId(newConv.id);
      setShowUsersList(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setIsStartingChat(false);
    }
  };

  const getOtherParticipant = (conv: any) => {
    return conv.participants?.find((p: any) => p.id !== user?.id) || conv.participants?.[0];
  };

  const filteredItems = showUsersList 
    ? availableUsers.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations.filter(conv => {
        const other = getOtherParticipant(conv);
        return other?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      });

  const activeConversation = conversations.find(c => c.id === selectedChatId);
  const activeOtherParticipant = activeConversation ? getOtherParticipant(activeConversation) : null;
  const isOnline = activeOtherParticipant ? onlineUsers.has(activeOtherParticipant.id) : false;

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
       {/* Sidebar List */}
       <Card className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col overflow-hidden`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-3">
               <h2 className="font-bold text-lg">{showUsersList ? 'New Chat' : 'Messages'}</h2>
               <button 
                 onClick={() => { setShowUsersList(!showUsersList); setSearchQuery(''); }}
                 className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                 title={showUsersList ? "View Messages" : "New Chat"}
               >
                 {showUsersList ? <MessageSquare size={18} /> : <Plus size={18} />}
               </button>
             </div>
             
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm outline-none" 
                  placeholder={showUsersList ? "Search users..." : "Search conversations..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {filteredItems.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-sm">
                  {showUsersList ? 'No users found' : 'No conversations found'}
                </div>
             ) : (
                showUsersList ? (
                  filteredItems.map((u) => {
                    const isOnlineList = onlineUsers.has(u.id);
                    return (
                      <div 
                        key={u.id} 
                        onClick={() => startNewChat(u.id)}
                        className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isStartingChat ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                         <div className="relative">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {u.name?.[0] || '?'}
                           </div>
                           {isOnlineList && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-800 dark:text-white truncate">{u.name}</h3>
                            <p className="text-xs text-slate-500 capitalize">{u.role?.toLowerCase() || 'User'}</p>
                         </div>
                      </div>
                    )
                  })
                ) : (
                  filteredItems.map((conv) => {
                     const other = getOtherParticipant(conv);
                     const lastMessage = conv.messages?.[0];
                     const isOnlineList = other ? onlineUsers.has(other.id) : false;
                     
                     // Unread messages count exactly
                     const unreadCount = conv.messages?.filter((m: any) => !m.isRead && m.senderId !== user?.id).length || 0;
                     const hasUnread = unreadCount > 0;
                     
                     return (
                       <div 
                         key={conv.id} 
                         onClick={() => setSelectedChatId(conv.id)}
                         className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedChatId === conv.id ? 'bg-primary-50 dark:bg-slate-700 border-r-4 border-primary-500' : ''}`}
                       >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold">
                               {other?.name?.[0] || '?'}
                            </div>
                            {isOnlineList && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-baseline mb-1">
                                <span className={`font-semibold text-slate-800 dark:text-white truncate ${hasUnread ? 'font-bold' : ''}`}>{other?.name}</span>
                                {lastMessage && <span className={`text-xs whitespace-nowrap ${hasUnread ? 'text-primary-600 font-bold' : 'text-slate-400'}`}>
                                  {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>}
                             </div>
                             <div className="flex justify-between items-center gap-2">
                               <p className={`text-sm truncate ${hasUnread ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                                 {lastMessage ? lastMessage.text : 'Start a conversation'}
                               </p>
                               {hasUnread && (
                                  <div className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                                     {unreadCount}
                                  </div>
                               )}
                             </div>
                          </div>
                       </div>
                     );
                  })
                )
             )}
          </div>
       </Card>

       {/* Chat Window */}
       {selectedChatId ? (
         <Card className={`${selectedChatId ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden`}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
               <div className="flex items-center gap-3">
                  <button className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" onClick={() => setSelectedChatId(null)}>
                     <ArrowLeft size={20} />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        {activeOtherParticipant?.name?.[0] || '?'}
                    </div>
                  </div>
                  <div>
                     <h3 className="font-bold">{activeOtherParticipant?.name}</h3>
                     <span className={`text-xs flex items-center gap-1 ${isOnline ? 'text-green-500' : 'text-slate-400'}`}>
                       ● {isOnline ? 'Online' : 'Offline'}
                     </span>
                  </div>
               </div>
               <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={20}/></button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/50">
               {messages.length === 0 && (
                 <div className="text-center text-slate-400 my-8">No messages yet. Say hi!</div>
               )}
               {messages.map(msg => {
                 const isMe = msg.senderId === user?.id;
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-tl-none border'} px-4 py-2 rounded-2xl max-w-xs shadow-sm`}>
                         <p className={`text-sm ${!isMe ? 'text-slate-700 dark:text-slate-200' : ''}`}>{msg.text}</p>
                         <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-primary-100 justify-end' : 'text-slate-400 justify-start'}`}>
                           <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           {isMe && (
                             msg.isRead ? <CheckCheck size={12} className="text-blue-300" /> : <Check size={12} />
                           )}
                         </div>
                      </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
               <div className="flex gap-2">
                  <Input 
                    placeholder="Type a message..." 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    className="flex-1"
                  />
                  <button onClick={handleSend} className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                     <Send size={18} />
                  </button>
               </div>
            </div>
         </Card>
       ) : (
         <Card className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-400">
           <div className="text-center">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
               <MessageSquare size={32} />
             </div>
             <p>Select a conversation or start a new chat</p>
             <button 
               onClick={() => setShowUsersList(true)}
               className="mt-4 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg font-medium hover:bg-primary-100 transition-colors"
             >
               Find Users
             </button>
           </div>
         </Card>
       )}
    </div>
  );
};