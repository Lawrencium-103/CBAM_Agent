"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string) => void;
    logout: () => void;
    freeUsesLeft: number;
    decrementFreeUse: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [freeUsesLeft, setFreeUsesLeft] = useState(1); // 1 Free use allowed
    const router = useRouter();

    // Load state from local storage on mount (mock persistence)
    useEffect(() => {
        const storedUser = localStorage.getItem('cbag_user');
        const storedUses = localStorage.getItem('cbag_free_uses');

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedUses) setFreeUsesLeft(parseInt(storedUses));
    }, []);

    const login = (email: string) => {
        const newUser = { email, name: email.split('@')[0] };
        setUser(newUser);
        localStorage.setItem('cbag_user', JSON.stringify(newUser));
        router.push('/chat');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('cbag_user');
        router.push('/');
    };

    const decrementFreeUse = () => {
        if (freeUsesLeft > 0) {
            const newCount = freeUsesLeft - 1;
            setFreeUsesLeft(newCount);
            localStorage.setItem('cbag_free_uses', newCount.toString());
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            freeUsesLeft,
            decrementFreeUse,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
