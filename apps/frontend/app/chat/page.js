"use client";

import React, { useState, useEffect, useRef } from "react";

// --- MOCK DATA (Thêm cả tin nhắn dạng ảnh) ---
const MOCK_USERS = [
    { id: 1, name: "Jane Doe", avatar: "https://i.pravatar.cc/150?u=jane", status: "Online" },
    { id: 2, name: "Emma Thompson", avatar: "https://i.pravatar.cc/150?u=emma", status: "Offline" },
    { id: 3, name: "Mitsne Admin", avatar: "https://ui-avatars.com/api/?name=Mitsne&background=random", status: "Offline" },
];

const MOCK_MESSAGES = [
    { id: 1, senderId: 1, text: "123", type: "text", time: "14:35" },
    { id: 2, senderId: 999, text: "Hey Jane, it's me in the prod!", type: "text", time: "17:20" }, // 999 là ID của mình
    { id: 3, senderId: 1, text: "heyy john!", type: "text", time: "17:20" },
    { id: 4, senderId: 1, text: "https://media.tenor.com/2Xy-g5yXyngAAAAM/coding-programming.gif", type: "image", time: "17:21" }, // Giả lập tin nhắn ảnh
    { id: 5, senderId: 1, text: "this is me irl", type: "text", time: "17:21" },
    { id: 6, senderId: 1, text: "hey john!", type: "text", time: "17:21" },
];

const MY_ID = 999;

export default function ChatPage() {
    const [selectedUser, setSelectedUser] = useState(MOCK_USERS[0]);
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);

    // Auto scroll xuống dưới cùng
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

    return (
        <div className="flex h-screen bg-[#121212] text-gray-200 font-sans overflow-hidden">

            {/* --- SIDEBAR (Contacts) --- */}
            <div className="w-80 bg-[#1E1E1E] flex flex-col border-r border-[#2f2f2f]">
                {/* Header Sidebar */}
                <div className="p-6">
                    <h2 className="text-xl font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Contacts
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <input type="checkbox" className="rounded bg-gray-700 border-gray-600 accent-[#D4AF37]" />
                        <span>Show online only <span className="text-xs">(1 online)</span></span>
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto px-3">
                    {MOCK_USERS.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`flex items-center p-3 mb-2 rounded-lg cursor-pointer transition-all ${selectedUser.id === user.id
                                    ? "bg-[#2A2A2A]"
                                    : "hover:bg-[#252525]"
                                }`}
                        >
                            <div className="relative">
                                <img src={user.avatar} alt="avt" className="w-12 h-12 rounded-full object-cover" />
                                {user.status === "Online" && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1E1E1E] rounded-full"></span>
                                )}
                            </div>
                            <div className="ml-4">
                                <h3 className="text-gray-200 font-medium">{user.name}</h3>
                                <p className={`text-xs ${user.status === "Online" ? "text-green-500" : "text-gray-500"}`}>
                                    {user.status}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- CHAT AREA --- */}
            <div className="flex-1 flex flex-col bg-[#121212] relative">

                {/* Chat Header */}
                <div className="h-20 px-6 flex items-center justify-between border-b border-[#2f2f2f]">
                    <div className="flex items-center gap-4">
                        <img src={selectedUser.avatar} alt="avt" className="w-10 h-10 rounded-full" />
                        <div>
                            <h3 className="font-bold text-lg">{selectedUser.name}</h3>
                            <span className="text-xs text-green-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                            </span>
                        </div>
                    </div>
                    <button className="text-gray-500 hover:text-white transition-colors">✕</button>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === MY_ID;
                        return (
                            <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`flex max-w-[70%] items-end gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>

                                    {/* Avatar nhỏ bên cạnh tin nhắn */}
                                    <img
                                        src={isMe ? "https://ui-avatars.com/api/?name=Me" : selectedUser.avatar}
                                        className="w-8 h-8 rounded-full mb-1"
                                    />

                                    {/* Nội dung tin nhắn */}
                                    <div className="flex flex-col gap-1">
                                        {/* Time stamp */}
                                        <span className={`text-[10px] text-gray-500 ${isMe ? "text-right" : "text-left"}`}>
                                            {msg.time}
                                        </span>

                                        {msg.type === 'image' ? (
                                            <div className="rounded-xl overflow-hidden border border-gray-700 bg-white p-1">
                                                <img src={msg.text} alt="sent image" className="max-w-xs object-cover rounded-lg" />
                                            </div>
                                        ) : (
                                            <div className={`px-4 py-3 text-sm rounded-2xl shadow-sm ${isMe
                                                    ? "bg-[#2A2A2A] text-white rounded-br-sm border border-[#333]" // Tin của mình: Đen/Xám
                                                    : "bg-white text-black rounded-bl-sm font-medium" // Tin người khác: Trắng (Tương phản cao)
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
                <div className="p-4 bg-[#121212]">
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full bg-[#1E1E1E] text-white pl-5 pr-12 py-4 rounded-xl border border-[#2f2f2f] focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-500"
                        />

                        {/* Nút gửi & Icon ảnh */}
                        <div className="absolute right-3 flex items-center gap-2">
                            <button type="button" className="p-2 text-gray-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </button>
                            <button type="submit" className="p-2 text-[#D4AF37] hover:text-yellow-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}