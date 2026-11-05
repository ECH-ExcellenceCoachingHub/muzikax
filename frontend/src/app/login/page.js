'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState(1); // 1: Email, 2: Password, 3: Name (for signup)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const router = useRouter();
    const { login } = useAuth();
    const googleLogin = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async (response) => {
            try {
                console.log('Google login response:', response);
                setIsLoading(true);
                setError('');
                // Check if we have a code (authorization code flow)
                const code = response.code;
                if (!code) {
                    setError('Google login failed: No authorization code received');
                    setIsLoading(false);
                    return;
                }
                // Send the Google authorization code to our backend
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code }),
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    setError(errorData.message || 'Google login failed');
                    setIsLoading(false);
                    return;
                }
                const userData = await res.json();
                // Store access token and refresh token in localStorage
                localStorage.setItem('accessToken', userData.accessToken);
                localStorage.setItem('refreshToken', userData.refreshToken);
                // Log in the user with actual data from API
                login({
                    id: userData._id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    creatorType: userData.creatorType
                });
                // Redirect based on user role
                if (userData.role === 'admin') {
                    router.push('/admin');
                }
                else {
                    router.push('/');
                }
            }
            catch (err) {
                console.error('Google login error:', err);
                setError('An unexpected error occurred. Please try again.');
                setIsLoading(false);
            }
        },
        onError: () => {
            setError('Google login failed. Please try again.');
        }
    });
    // Reset form when switching between login/signup
    useEffect(() => {
        setEmail('');
        setPassword('');
        setName('');
        setError('');
        setStep(1);
        setShowPassword(false);
        setShowSignupPassword(false);
        setAgreeToTerms(false);
    }, [isLogin]);
    const handleEmailSubmit = (e) => {
        e.preventDefault();
        setError(''); // Clear any previous errors
        if (isLogin) {
            setStep(2); // Go to password step for login
        }
        else {
            setStep(3); // Go to name step for signup
        }
    };
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        // Validate password
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Login failed');
                setIsLoading(false);
                return;
            }
            const userData = await response.json();
            // Store access token and refresh token in localStorage
            localStorage.setItem('accessToken', userData.accessToken);
            localStorage.setItem('refreshToken', userData.refreshToken);
            // Log in the user with actual data from API
            login({
                id: userData._id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                creatorType: userData.creatorType
            });
            // Redirect based on user role
            if (userData.role === 'admin') {
                router.push('/admin');
            }
            else {
                // All other users go to home page after login
                router.push('/');
            }
        }
        catch (error) {
            console.error('Login error:', error);
            setError('An unexpected error occurred. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        // Validate password
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }
        // Check if password contains letters, numbers, and special characters
        const hasLetters = /[a-zA-Z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        if (!hasLetters || !hasNumbers || !hasSpecialChar) {
            setError('Password must contain letters, numbers, and special characters');
            return;
        }
        // Check terms agreement
        if (!agreeToTerms) {
            setError('Please agree to the Terms and Privacy Policy');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Registration failed');
                setIsLoading(false);
                return;
            }
            const userData = await response.json();
            // Store access token and refresh token in localStorage
            localStorage.setItem('accessToken', userData.accessToken);
            localStorage.setItem('refreshToken', userData.refreshToken);
            // Log in the user with actual data from API
            login({
                id: userData._id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                creatorType: userData.creatorType
            });
            // Redirect based on user role
            if (userData.role === 'admin') {
                router.push('/admin');
            }
            else {
                // All other users go to home page after signup
                router.push('/');
            }
        }
        catch (error) {
            console.error('Signup error:', error);
            setError('An unexpected error occurred. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleBack = () => {
        setError(''); // Clear any previous errors
        if (step === 2) {
            setStep(1);
        }
        else if (step === 3) {
            setStep(1);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black p-4 pb-24 overflow-visible relative", children: [_jsx("div", { className: "absolute top-1/3 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10 opacity-70 md:w-64 md:h-64 md:top-1/4 md:left-1/4" }), _jsx("div", { className: "absolute bottom-1/3 right-0 w-48 h-48 bg-primary-light/10 rounded-full blur-3xl -z-10 opacity-70 md:w-64 md:h-64 md:bottom-1/4 md:right-1/4" }), _jsxs("div", { className: "w-full max-w-md space-y-6 sm:space-y-8 card-bg rounded-2xl p-6 sm:p-8 border border-gray-700/50 shadow-2xl shadow-primary/10 relative z-10", children: [_jsxs("div", { className: "text-center animate-fade-in", children: [_jsx("div", { className: "flex justify-center mb-4 items-center", children: _jsx("img", { src: "/muzikax.png", alt: "MuzikaX - Rwanda's Digital Music Ecosystem", className: "h-20 w-20 sm:h-24 sm:w-24 mx-auto transition-transform duration-300 hover:scale-105 object-contain drop-shadow-2xl rounded-lg" }) }), _jsx("h1", { className: "text-2xl sm:text-3xl font-bold text-white mb-2", children: "MuzikaX" }), _jsx("h2", { className: "mt-2 sm:mt-3 text-xl sm:text-2xl font-bold text-white", children: isLogin ? 'Welcome back' : 'Create account' }), _jsx("p", { className: "mt-2 sm:mt-3 text-gray-300 text-sm sm:text-base max-w-md mx-auto", children: isLogin
                                    ? 'Sign in to your account to continue'
                                    : 'Join our community of Rwandan music creators and fans' }), _jsx("p", { className: "mt-2 text-gray-400 text-xs sm:text-sm max-w-md mx-auto", children: isLogin ? '' : 'All new accounts start as regular users. You can upgrade to a creator account later.' })] }), _jsxs("div", { className: "flex bg-gray-800/50 rounded-lg p-1", children: [_jsx("button", { className: `flex-1 py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors ${isLogin
                                    ? 'bg-primary text-white'
                                    : 'text-gray-400 hover:text-white'}`, onClick: () => {
                                    setIsLogin(true);
                                    setStep(1);
                                }, children: "Login" }), _jsx("button", { className: `flex-1 py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors ${!isLogin
                                    ? 'bg-primary text-white'
                                    : 'text-gray-400 hover:text-white'}`, onClick: () => {
                                    setIsLogin(false);
                                    setStep(1);
                                }, children: "Sign Up" })] }), step === 1 && (_jsxs("form", { className: "mt-6 sm:mt-8 space-y-6", onSubmit: handleEmailSubmit, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-300 mb-1", children: "Email address" }), _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base", placeholder: "you@example.com" })] }), error && (_jsx("div", { className: "text-red-500 text-sm py-2", children: error })), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading, className: "w-full py-2.5 sm:py-3 px-4 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-gray-900 text-sm sm:text-base flex items-center justify-center disabled:opacity-70", children: isLoading ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Processing..."] })) : 'Next' }) })] })), step === 2 && isLogin && (_jsxs("form", { className: "mt-6 sm:mt-8 space-y-6", onSubmit: handleLoginSubmit, children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-300", children: "Password" }), _jsx("div", { className: "text-sm", children: _jsx("a", { href: "#", className: "font-medium text-primary hover:text-primary/80", children: "Forgot password?" }) })] }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "password", name: "password", type: showPassword ? "text" : "password", autoComplete: "current-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base pr-10", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300", children: showPassword ? (_jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" }) })) : (_jsxs("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) })] }), password && password.length < 6 && (_jsx("p", { className: "mt-1 text-xs text-red-400", children: "Password must be at least 6 characters" }))] }), error && (_jsx("div", { className: "text-red-500 text-sm py-2", children: error })), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading, className: "w-full py-2.5 sm:py-3 px-4 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-gray-900 text-sm sm:text-base flex items-center justify-center disabled:opacity-70", children: isLoading ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Signing in..."] })) : 'Sign in' }) })] })), step === 3 && !isLogin && (_jsxs("form", { className: "mt-6 sm:mt-8 space-y-6", onSubmit: handleSignupSubmit, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-300 mb-1", children: "Full name" }), _jsx("input", { id: "name", name: "name", type: "text", autoComplete: "name", required: true, value: name, onChange: (e) => setName(e.target.value), className: "w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base", placeholder: "John Doe" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "signup-password", className: "block text-sm font-medium text-gray-300 mb-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "signup-password", name: "password", type: showSignupPassword ? "text" : "password", autoComplete: "new-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base pr-10", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("button", { type: "button", onClick: () => setShowSignupPassword(!showSignupPassword), className: "absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300", children: showSignupPassword ? (_jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" }) })) : (_jsxs("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) })] }), _jsxs("div", { className: "mt-2 space-y-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Password requirements:" }), _jsxs("ul", { className: "text-xs space-y-1", children: [_jsx("li", { className: password.length >= 8 ? "text-green-400" : "text-gray-500", children: "\u2022 At least 8 characters" }), _jsx("li", { className: /[a-zA-Z]/.test(password) ? "text-green-400" : "text-gray-500", children: "\u2022 Contains letters" }), _jsx("li", { className: /[0-9]/.test(password) ? "text-green-400" : "text-gray-500", children: "\u2022 Contains numbers" }), _jsx("li", { className: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-400" : "text-gray-500", children: "\u2022 Contains special characters" })] })] })] }), error && (_jsx("div", { className: "text-red-500 text-sm py-2", children: error })), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex items-center h-5", children: _jsx("input", { id: "terms", name: "terms", type: "checkbox", checked: agreeToTerms, onChange: (e) => setAgreeToTerms(e.target.checked), className: "h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded bg-gray-700" }) }), _jsx("div", { className: "ml-3 text-sm", children: _jsxs("label", { htmlFor: "terms", className: "text-gray-300", children: ["I agree to the", ' ', _jsx(Link, { href: "/terms", className: "text-primary hover:text-primary/80", children: "Terms of Service" }), ' ', "and", ' ', _jsx(Link, { href: "/privacy", className: "text-primary hover:text-primary/80", children: "Privacy Policy" })] }) })] }), _jsx("div", { className: "text-sm text-gray-400", children: "By signing up, you'll be registered as a regular user. You can upgrade to a creator account when you're ready to upload music." }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading, className: "w-full py-2.5 sm:py-3 px-4 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-gray-900 text-sm sm:text-base flex items-center justify-center disabled:opacity-70", children: isLoading ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Creating account..."] })) : 'Create account' }) })] })), _jsxs("div", { className: "mt-4 sm:mt-6", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-700" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-gray-900 text-gray-400", children: "Or continue with" }) })] }), _jsx("div", { className: "mt-4 sm:mt-6", children: _jsxs("button", { onClick: () => googleLogin(), disabled: isLoading, className: "w-full inline-flex justify-center py-2 px-4 rounded-lg bg-gray-800/50 text-gray-300 hover:text-white transition-colors border border-gray-700 items-center", children: [_jsx("svg", { className: "w-5 h-5 mr-2", fill: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" }) }), "Continue with Google"] }) })] }), _jsx("div", { className: "text-center mt-4 sm:mt-6", children: _jsxs("p", { className: "text-sm text-gray-400", children: [isLogin ? "Don't have an account? " : "Already have an account? ", _jsx("button", { onClick: () => {
                                        setIsLogin(!isLogin);
                                        setStep(1);
                                    }, className: "font-medium text-primary hover:text-primary/80 transition-colors", children: isLogin ? 'Sign up' : 'Sign in' })] }) })] })] }));
}
