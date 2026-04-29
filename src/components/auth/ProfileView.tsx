import React, { useState, useEffect } from 'react';
import { supabase } from './AuthView';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { User, LogOut, ArrowLeft, HelpCircle } from "lucide-react";
import { AppHeader } from "../AppHeader";

export const ProfileView = ({ onBack, onSignOut, onShowOnboarding }: { onBack: () => void, onSignOut: () => void, onShowOnboarding?: () => void }) => {
    const [user, setUser] = useState<any>(null);
    

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        onSignOut();
    };

    if (!user) return <div className="p-8 text-center">Profil betöltése...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <AppHeader
                onBrandClick={onBack}
                description="Profil és fiókbeállítások"
            >
                <Button
                    variant="ghost"
                    onClick={onBack}
                    aria-label="Vissza a galériához"
                    className="text-slate-500 hover:text-indigo-600 h-10 w-10 p-0 sm:w-auto sm:px-3 flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline text-sm font-medium">Vissza a galériához</span>
                </Button>
            </AppHeader>

            <main id="main-content" role="main" className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                    <User className="w-8 h-8" />
                                </div>
                                <div>
                                    <CardTitle>{user.user_metadata?.full_name || "Felhasználó"}</CardTitle>
                                    <CardDescription>{user.email}</CardDescription>
                                </div>
                            </div>
                            <Button variant="destructive" onClick={handleSignOut}>
                                <LogOut className="w-4 h-4 mr-2" /> Kijelentkezés
                            </Button>
                        </div>
                    </CardHeader>
                    {onShowOnboarding && (
                        <CardContent className="border-t pt-6">
                             <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium">Alkalmazás bemutató</h4>
                                    <p className="text-sm text-slate-500">Játszd le újra az ismertetőt az alkalmazás használatának megismeréséhez.</p>
                                </div>
                                <Button variant="outline" onClick={onShowOnboarding}>
                                    <HelpCircle className="w-4 h-4 mr-2" /> Bemutató megtekintése
                                </Button>
                             </div>
                        </CardContent>
                    )}
                </Card>

                {/* Admin controls removed */}
            </main>
        </div>
    );
};
