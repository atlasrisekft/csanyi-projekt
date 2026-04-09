import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export const AuthView = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Login State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Signup State
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");

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
            setError(err.message || "Nem sikerült bejelentkezni");
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
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

                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Bejelentkezés</TabsTrigger>
                            <TabsTrigger value="signup">Regisztráció</TabsTrigger>
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
                                    <Label htmlFor="password">Jelszó</Label>
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
                </CardContent>
            </Card>
        </div>
    );
};
