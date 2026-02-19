"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import SocketService from "@/services/socket.service";

export default function ChatPage() {
    const { user, logout } = useAuth();

    // State management
    const [users, setUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    const messagesEndRef = useRef(null);
    const socketService = useRef(null);
    const selectedRoomRef = useRef(null);

    // Update ref when selectedRoom changes
    useEffect(() => {
        selectedRoomRef.current = selectedRoom;
    }, [selectedRoom]);

    // Auto scroll xuống dưới cùng khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Initialize: Load users and connect socket
    useEffect(() => {
        if (!user?.id) return;

        loadUsers();
        loadMyRooms();
        connectSocket();

        return () => {
            if (socketService.current) {
                socketService.current.disconnect();
            }
        };
    }, [user]);

    // Connect Socket.IO
    const connectSocket = () => {
        if (!user?.id) return;

        socketService.current = new SocketService();
        socketService.current.connect(user.id);

        // Listen for socket events
        socketService.current.socket.on('connect', () => {
            console.log('✅ Socket connected');
            setSocketConnected(true);
        });

        socketService.current.socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setSocketConnected(false);
        });

        // Listen for new messages
        socketService.current.onNewMessage((data) => {
            console.log('\n📨 [FRONTEND] New message event received!');
            console.log('📦 [FRONTEND] Data:', data);
            if (data.message) {
                // Handle both populated room (object) and room ID (string)
                const messageRoomId = typeof data.message.room === 'object'
                    ? data.message.room._id
                    : data.message.room;

                // Use ref to get latest selectedRoom value
                const currentRoom = selectedRoomRef.current;
                console.log('🔍 [FRONTEND] Current room:', currentRoom?._id);
                console.log('🔍 [FRONTEND] Message room:', messageRoomId);
                console.log('🔍 [FRONTEND] Match:', currentRoom && messageRoomId === currentRoom._id);

                if (currentRoom && messageRoomId === currentRoom._id) {
                    console.log('✅ [FRONTEND] Room matched! Adding message to UI');
                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => m._id === data.message._id)) {
                            console.log('⚠️ [FRONTEND] Duplicate message, skipping');
                            return prev;
                        }
                        console.log('💬 [FRONTEND] Message appended to state');
                        return [...prev, data.message];
                    });
                } else {
                    console.log('❌ [FRONTEND] Room not matched or no current room');
                }
            }
        });
    };

    // Load all users
    const loadUsers = async () => {
        try {
            const response = await fetch('/api/proxy/users');
            const data = await response.json();
            if (data.users) {
                setUsers(data.users.filter(u => u._id !== user?.id));
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    // Load my rooms
    const loadMyRooms = async () => {
        try {
            const response = await fetch('/api/proxy/rooms/my-rooms');
            const data = await response.json();
            if (data.rooms) {
                setRooms(data.rooms);
            }
        } catch (error) {
            console.error('Error loading rooms:', error);
        }
    };

    // Handle user click -> find or create room
    const handleUserClick = async (selectedUser) => {
        try {
            setLoading(true);

            // Find or create room
            const response = await fetch('/api/proxy/rooms/find-or-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otherUserId: selectedUser._id }),
            });

            const data = await response.json();
            if (data.room) {
                setSelectedRoom(data.room);

                // Join socket room
                if (socketService.current) {
                    socketService.current.joinRoom(data.room._id);
                }

                // Load messages
                await loadMessages(data.room._id);

                // Update rooms list if new room
                if (data.isNew) {
                    setRooms(prev => [data.room, ...prev]);
                }
            }
        } catch (error) {
            console.error('Error creating room:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load messages for a room
    const loadMessages = async (roomId) => {
        try {
            const response = await fetch(`/api/proxy/messages/${roomId}?limit=50`);
            const data = await response.json();
            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedRoom) return;

        try {
            const response = await fetch('/api/proxy/message/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: selectedRoom._id,
                    content: inputText,
                    type: 'text',
                }),
            });

            const data = await response.json();
            if (data.success && data.message) {
                setInputText("");
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Get other user in a 1-1 room
    const getOtherUser = (room) => {
        if (!room || !room.members) return null;
        return room.members.find(m => m._id !== user?.id);
    };

    return (
        <div className="flex h-screen bg-[#0F0F0F] text-gray-200 font-sans overflow-hidden">

            {/* --- SIDEBAR (Contacts) --- */}
            <div className="w-80 bg-[#1A1A1A] flex flex-col border-r border-[#2A2A2A]">
                {/* Header Sidebar */}
                <div className="p-5 border-b border-[#2A2A2A]">
                    {/* User Profile */}
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'User'}`}
                            alt="avatar"
                            className="w-10 h-10 rounded-full border-2 border-[#D4AF37]"
                        />
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm">{user?.fullName || user?.username || "User"}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                {socketConnected ? 'Online' : 'Offline'}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors text-gray-400 hover:text-red-400"
                            title="Đăng xuất"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>

                    <h2 className="text-lg font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Contacts ({users.length})
                    </h2>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto px-3 py-2">
                    {loading && (
                        <div className="text-center py-4 text-gray-500">Loading...</div>
                    )}

                    {!loading && users.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            Chưa có user nào. <br />Hãy đăng ký thêm tài khoản để chat!
                        </div>
                    )}

                    {users.map((contact) => {
                        const otherUser = contact;
                        return (
                            <div
                                key={contact._id}
                                onClick={() => handleUserClick(contact)}
                                className={`flex items-center p-3 mb-1 rounded-lg cursor-pointer transition-all ${selectedRoom && getOtherUser(selectedRoom)?._id === contact._id
                                    ? "bg-[#2A2A2A] border-l-2 border-[#D4AF37]"
                                    : "hover:bg-[#222222]"
                                    }`}
                            >
                                <div className="relative">
                                    <img
                                        src={contact.avatar || `https://ui-avatars.com/api/?name=${contact.username}`}
                                        alt="avatar"
                                        className="w-11 h-11 rounded-full object-cover"
                                    />
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                    <h3 className="text-gray-200 font-medium text-sm truncate">
                                        {contact.fullName || contact.username}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate">
                                        @{contact.username}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- CHAT AREA --- */}
            <div className="flex-1 flex flex-col bg-[#0F0F0F] relative">

                {!selectedRoom ? (
                    /* Empty state */
                    <div className="flex-1 flex items-center justify-center flex-col gap-4 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-lg">Chọn một user để bắt đầu chat</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 flex items-center justify-between border-b border-[#2A2A2A] bg-[#1A1A1A]">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img
                                        src={getOtherUser(selectedRoom)?.avatar || `https://ui-avatars.com/api/?name=${getOtherUser(selectedRoom)?.username}`}
                                        alt="avatar"
                                        className="w-10 h-10 rounded-full border border-[#2A2A2A]"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base">
                                        {getOtherUser(selectedRoom)?.fullName || getOtherUser(selectedRoom)?.username}
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        @{getOtherUser(selectedRoom)?.username}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-[#0F0F0F] to-[#121212]">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                    Chưa có tin nhắn. Hãy gửi tin nhắn đầu tiên! 👋
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender?._id === user?.id;
                                    const senderInfo = isMe ? user : getOtherUser(selectedRoom);

                                    return (
                                        <div key={msg._id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                                            <div className={`flex max-w-[70%] items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>

                                                {/* Avatar */}
                                                <img
                                                    src={senderInfo?.avatar || `https://ui-avatars.com/api/?name=${senderInfo?.username}`}
                                                    className="w-8 h-8 rounded-full border border-[#2A2A2A] flex-shrink-0"
                                                    alt="avatar"
                                                />

                                                {/* Message Content */}
                                                <div className="flex flex-col gap-1">
                                                    {/* Timestamp */}
                                                    <span className={`text-[10px] text-gray-500 px-1 ${isMe ? "text-right" : "text-left"}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>

                                                    {msg.type === 'image' ? (
                                                        <div className="rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#1A1A1A] p-1">
                                                            <img
                                                                src={msg.content}
                                                                alt="sent content"
                                                                className="max-w-xs object-cover rounded-lg"
                                                                onError={(e) => e.target.style.display = 'none'}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className={`px-4 py-2.5 text-sm rounded-2xl shadow-md ${isMe
                                                            ? "bg-[#D4AF37] text-black rounded-br-sm font-medium"
                                                            : "bg-[#1A1A1A] text-gray-200 rounded-bl-sm border border-[#2A2A2A]"
                                                            }`}>
                                                            {msg.content}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#1A1A1A] border-t border-[#2A2A2A]">
                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 bg-[#0F0F0F] text-white px-4 py-3 rounded-xl border border-[#2A2A2A] focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-500"
                                />

                                {/* Send button */}
                                <button
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    className={`p-3 rounded-xl transition-all ${inputText.trim()
                                        ? "bg-[#D4AF37] text-black hover:bg-[#C4A027]"
                                        : "bg-[#2A2A2A] text-gray-600 cursor-not-allowed"
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </form>

                            {/* Socket Status */}
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                <span>{socketConnected ? 'Connected to server' : 'Disconnected'}</span>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}