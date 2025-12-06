"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Replace with your actual Render URL
const WEBHOOK_URL = "https://cbam-agent.onrender.com/webhook";

interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
}

export default function ChatPage() {
    const { user, isAuthenticated, freeUsesLeft, decrementFreeUse } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'agent', content: 'Hello! I am CBAg, your AI expert on the Carbon Border Adjustment Mechanism. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        // Auth Check: If not logged in and no free uses left
        if (!isAuthenticated && freeUsesLeft <= 0) {
            router.push('/register');
            return;
        }

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        if (!isAuthenticated) {
            decrementFreeUse();
        }

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: userMsg.content,
                    sessionId: user ? `user-${user.email}` : `guest-${Date.now()}`
                })
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            const agentMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: data.output };
            setMessages(prev => [...prev, agentMsg]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: "I'm having trouble connecting to the server. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            {/* Header */}
            <header className="glass border-b border-white/10 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Bot className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">CBAg Assistant</h1>
                        <div className="flex items-center gap-2 text-xs text-green-400">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                        </div>
                    </div>
                </div>

                {!isAuthenticated && (
                    <div className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                        Free uses left: <span className="text-white font-bold">{freeUsesLeft}</span>
                    </div>
                )}

                {isAuthenticated && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">Welcome, {user?.name}</span>
                    </div>
                )}
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] md:max-w-[60%] p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'glass-card text-gray-200 rounded-bl-none'
                                }`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="glass-card p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            <span className="text-sm text-gray-400">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 glass border-t border-white/10">
                <div className="max-w-4xl mx-auto relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={!isAuthenticated && freeUsesLeft === 0 ? "Please register to continue..." : "Ask a question about CBAM..."}
                        disabled={isLoading || (!isAuthenticated && freeUsesLeft === 0)}
                        className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || (!isAuthenticated && freeUsesLeft === 0)}
                        className="absolute right-2 top-2 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                </div>
                {!isAuthenticated && freeUsesLeft === 0 && (
                    <div className="text-center mt-2">
                        <button onClick={() => router.push('/register')} className="text-blue-400 text-sm hover:underline">
                            Limit reached. Click here to Register for free access.
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
