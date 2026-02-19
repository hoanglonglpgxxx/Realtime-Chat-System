"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

// --- MOCK DATA (Sẽ thay thế bằng Socket.IO sau) ---
const MOCK_USERS = [
    { id: 1, name: "Jane Doe", avatar: "https://i.pravatar.cc/150?u=jane", status: "Online" },
    { id: 2, name: "Emma Thompson", avatar: "https://i.pravatar.cc/150?u=emma", status: "Offline" },
    { id: 3, name: "Mitsne Admin", avatar: "https://ui-avatars.com/api/?name=Mitsne&background=random", status: "Offline" },
];

const MOCK_MESSAGES = [
    { id: 1, senderId: 1, text: "Chào bạn!", type: "text", time: "14:35" },
    { id: 2, senderId: 999, text: "Hey, how are you?", type: "text", time: "17:20" },
    { id: 3, senderId: 1, text: "I'm good, thanks!", type: "text", time: "17:20" },
    { id: 4, senderId: 1, text: "https://media.tenor.com/2Xy-g5yXyngAAAAM/coding-programming.gif", type: "image", time: "17:21" },
    { id: 5, senderId: 1, text: "This is me coding 😄", type: "text", time: "17:21" },
];

const MY_ID = 999; // Sẽ lấy từ user.id sau khi tích hợp auth

export default function ChatPage() {
    const { user, logout } = useAuth();
    const [selectedUser, setSelectedUser] = useState(MOCK_USERS[0]);
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState("");
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto scroll xuống dưới cùng khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newMsg = {
            id: messages.length + 1,
            senderId: MY_ID,
            text: inputText,
            type: "text",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages([...messages, newMsg]);
        setInputText("");
    };

    // Lọc users theo online status
    const filteredUsers = showOnlineOnly
        ? MOCK_USERS.filter(u => u.status === "Online")
        : MOCK_USERS;

    const onlineCount = MOCK_USERS.filter(u => u.status === "Online").length;

    return (
        <div className="flex h-screen bg-[#0F0F0F] text-gray-200 font-sans overflow-hidden">

            {/* --- SIDEBAR (Contacts) --- */}
            <div className="w-80 bg-[#1A1A1A] flex flex-col border-r border-[#2A2A2A]">
                {/* Header Sidebar */}
                <div className="p-5 border-b border-[#2A2A2A]">
                    {/* User Profile */}
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={user?.avatar || "https://ui-avatars.com/api/?name=User"}
                            alt="avatar"
                            className="w-10 h-10 rounded-full border-2 border-[#D4AF37]"
                        />
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm">{user?.fullName || user?.username || "User"}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Online
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
                        Contacts
                    </h2>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <input
                            type="checkbox"
                            checked={showOnlineOnly}
                            onChange={(e) => setShowOnlineOnly(e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 accent-[#D4AF37] cursor-pointer"
                            id="online-only"
                        />
                        <label htmlFor="online-only" className="cursor-pointer">
                            Show online only <span className="text-xs">({onlineCount} online)</span>
                        </label>
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto px-3 py-2">
                    {filteredUsers.map((contact) => (
                        <div
                            key={contact.id}
                            onClick={() => setSelectedUser(contact)}
                            className={`flex items-center p-3 mb-1 rounded-lg cursor-pointer transition-all ${selectedUser.id === contact.id
                                ? "bg-[#2A2A2A] border-l-2 border-[#D4AF37]"
                                : "hover:bg-[#222222]"
                                }`}
                        >
                            <div className="relative">
                                <img src={contact.avatar} alt="avatar" className="w-11 h-11 rounded-full object-cover" />
                                {contact.status === "Online" && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1A1A1A] rounded-full"></span>
                                )}
                            </div>
                            <div className="ml-3">
                                <h3 className="text-gray-200 font-medium text-sm">{contact.name}</h3>
                                <p className={`text-xs ${contact.status === "Online" ? "text-green-500" : "text-gray-500"}`}>
                                    {contact.status}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- CHAT AREA --- */}
            <div className="flex-1 flex flex-col bg-[#0F0F0F] relative">

                {/* Chat Header */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-[#2A2A2A] bg-[#1A1A1A]">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <img src={selectedUser.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-[#2A2A2A]" />
                            {selectedUser.status === "Online" && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1A1A1A] rounded-full"></span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-base">{selectedUser.name}</h3>
                            <span className={`text-xs flex items-center gap-1 ${selectedUser.status === "Online" ? "text-green-500" : "text-gray-500"}`}>
                                <span className={`w-2 h-2 rounded-full ${selectedUser.status === "Online" ? "bg-green-500" : "bg-gray-500"}`}></span>
                                {selectedUser.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors text-gray-400 hover:text-white"
                            title="Tìm kiếm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <button
                            className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors text-gray-400 hover:text-white"
                            title="Cài đặt"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-[#0F0F0F] to-[#121212]">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === MY_ID;
                        return (
                            <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`flex max-w-[70%] items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>

                                    {/* Avatar */}
                                    <img
                                        src={isMe ? (user?.avatar || "https://ui-avatars.com/api/?name=Me") : selectedUser.avatar}
                                        className="w-8 h-8 rounded-full border border-[#2A2A2A] flex-shrink-0"
                                        alt="avatar"
                                    />

                                    {/* Message Content */}
                                    <div className="flex flex-col gap-1">
                                        {/* Timestamp */}
                                        <span className={`text-[10px] text-gray-500 px-1 ${isMe ? "text-right" : "text-left"}`}>
                                            {msg.time}
                                        </span>

                                        {msg.type === 'image' ? (
                                            <div className="rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#1A1A1A] p-1">
                                                <img
                                                    src={msg.text}
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
                                                {msg.text}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#1A1A1A] border-t border-[#2A2A2A]">
                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                        {/* Emoji/Attachment buttons */}
                        <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-[#D4AF37] transition-colors hover:bg-[#2A2A2A] rounded-lg"
                            title="Đính kèm file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>

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

                    {/* Socket Status Indicator (for later Socket.IO integration) */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>Connected to server</span>
                    </div>
                </div>

            </div>
        </div>
    );
}