import React, { useState, useEffect } from 'react';
import { supabase } from './AuthView';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { User, LogOut, ArrowLeft, HelpCircle } from "lucide-react";

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
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <Button variant="ghost" onClick={onBack} className="mb-4 pl-0 hover:bg-transparent hover:text-indigo-600">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Vissza a galériához
                </Button>

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
            </div>
        </div>
    );
};
