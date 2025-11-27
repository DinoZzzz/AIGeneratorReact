import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Login = () => {
    const [identifier, setIdentifier] = useState(''); // Can be email or username
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let emailToUse = identifier;

            // Check if input is an email (contains @)
            const isEmail = identifier.includes('@');

            // If not an email, treat as username and lookup email
            if (!isEmail) {
                const { data, error: lookupError } = await supabase
                    .from('profiles')
                    .select('email')
                    .ilike('username', identifier)
                    .single();

                if (lookupError) {
                    throw new Error('Username not found. Please use your email address to login.');
                }

                if (!data?.email) {
                    throw new Error('Username found but no email associated. Please contact support.');
                }

                emailToUse = data.email;
            }

            // Sign in with email
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password,
            });

            if (signInError) throw signInError;
            navigate('/');
        } catch (err: unknown) {
            const errorMessage = (err as Error).message || 'Failed to login';
            if (errorMessage.includes('Invalid login credentials')) {
                setError('Invalid username/email or password');
            } else if (errorMessage.includes('Username not found')) {
                setError('Username not found');
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/20 -z-10" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-primary p-3 rounded-xl shadow-lg shadow-primary/20">
                        <Lock className="h-8 w-8 text-primary-foreground" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Welcome back
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Sign in to your account to continue
                </p>
            </div>

            <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-card py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 sm:rounded-xl border border-border/50 backdrop-blur-sm">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm flex items-center">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        <div>
                            <Input
                                id="identifier"
                                name="identifier"
                                type="text"
                                autoComplete="username"
                                required
                                label="Email or Username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="you@example.com or username"
                            />
                        </div>

                        <div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full"
                                loading={loading}
                            >
                                Sign in
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
