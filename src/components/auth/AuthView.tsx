import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AppHeader } from "../AppHeader";
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export const AuthView = ({ onLoginSuccess, onBack }: { onLoginSuccess: () => void; onBack?: () => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'login' | 'forgot' | 'forgot-sent' | 'recovery'>(() => {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        return hash.includes('type=recovery') ? 'recovery' : 'login';
    });

    // Login State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Signup State
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");

    // Forgot / Recovery State
    const [forgotEmail, setForgotEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            setMode('forgot-sent');
        } catch (err: any) {
            setError(err.message || "Nem sikerült elküldeni a visszaállítási emailt");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== newPasswordConfirm) {
            setError("A két jelszó nem egyezik");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || "Nem sikerült beállítani az új jelszót");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) throw error;
            onLoginSuccess();
        } catch (err: any) {
            const msg: string = err.message || "";
            if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
                setError("Hibás email cím vagy jelszó.");
            } else if (msg.includes("Email not confirmed")) {
                setError("Az email cím nincs megerősítve.");
            } else if (msg.includes("Too many requests")) {
                setError("Túl sok bejelentkezési kísérlet. Próbáld újra később.");
            } else {
                setError(msg || "Nem sikerült bejelentkezni.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Use our custom server endpoint for auto-confirm
            const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5be515e6/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${publicAnonKey}`
                },
                body: JSON.stringify({
                    email: signupEmail,
                    password: signupPassword,
                    name: signupName
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "A regisztráció sikertelen");
            }

            // Auto login after signup
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: signupEmail,
                password: signupPassword,
            });

            if (loginError) throw loginError;
            onLoginSuccess();

        } catch (err: any) {
            setError(err.message || "Nem sikerült a regisztráció");
        } finally {
            setIsLoading(false);
        }
    };

    if (mode === 'recovery') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-indigo-600">Új jelszó beállítása</CardTitle>
                        <CardDescription>Add meg az új jelszavadat</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Hiba</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Új jelszó</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password-confirm">Jelszó megerősítése</Label>
                                <Input
                                    id="new-password-confirm"
                                    type="password"
                                    value={newPasswordConfirm}
                                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Jelszó mentése
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <AppHeader
                onBrandClick={onBack}
                description="Bejelentkezés vagy fiók létrehozása"
            >
                {onBack && (
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        aria-label="Vissza a galériához"
                        className="text-slate-500 hover:text-indigo-600 h-10 w-10 p-0 sm:w-auto sm:px-3 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="hidden sm:inline text-sm font-medium">Vissza a galériához</span>
                    </Button>
                )}
            </AppHeader>
            <main id="main-content" role="main" className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-indigo-600">Hangtérkép</CardTitle>
                    <CardDescription>Jelentkezz be a hangprojektjeid kezeléséhez</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Hiba</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {mode === 'forgot' || mode === 'forgot-sent' ? (
                        <div className="space-y-4">
                            {mode === 'forgot-sent' ? (
                                <div className="text-center py-4 space-y-2">
                                    <p className="text-sm font-medium text-slate-700">Email elküldve!</p>
                                    <p className="text-sm text-slate-500">
                                        Elküldtük a jelszó visszaállítási linket a(z) <span className="font-medium">{forgotEmail}</span> címre.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <p className="text-sm text-slate-500">
                                        Add meg az email címed, és küldünk egy visszaállítási linket.
                                    </p>
                                    <div className="space-y-2">
                                        <Label htmlFor="forgot-email">Email cím</Label>
                                        <Input
                                            id="forgot-email"
                                            type="email"
                                            placeholder="m@example.com"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Link küldése
                                    </Button>
                                </form>
                            )}
                            <button
                                type="button"
                                onClick={() => { setMode('login'); setError(null); }}
                                className="w-full text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                                ← Vissza a bejelentkezéshez
                            </button>
                        </div>
                    ) : (
                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4 h-11 rounded-full p-1">
                                <TabsTrigger value="login" className="rounded-full">Bejelentkezés</TabsTrigger>
                                <TabsTrigger value="signup" className="rounded-full">Regisztráció</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email cím</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Jelszó</Label>
                                            <button
                                                type="button"
                                                onClick={() => { setForgotEmail(loginEmail); setMode('forgot'); setError(null); }}
                                                className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                                            >
                                                Elfelejtett jelszó?
                                            </button>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Bejelentkezés
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="signup">
                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Teljes név</Label>
                                        <Input
                                            id="name"
                                            placeholder="Kovács János"
                                            value={signupName}
                                            onChange={(e) => setSignupName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email cím</Label>
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            placeholder="m@example.com"
                                            value={signupEmail}
                                            onChange={(e) => setSignupEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Jelszó</Label>
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            value={signupPassword}
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Fiók létrehozása
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>
            </main>
        </div>
    );
};
