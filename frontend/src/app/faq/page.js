"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Link from "next/link";
export default function FAQPage() {
    const [openQuestion, setOpenQuestion] = useState(null);
    const toggleQuestion = (index) => {
        setOpenQuestion(openQuestion === index ? null : index);
    };
    const faqCategories = [
        {
            title: "Getting Started",
            icon: "🚀",
            questions: [
                {
                    question: "How do I create an account on MuzikaX?",
                    answer: "Click the 'Sign Up' button in the top right corner of our homepage. You can sign up using your email address or through Google authentication. After creating your account, you'll be able to browse music, create playlists, and follow your favorite artists."
                },
                {
                    question: "Is there a mobile app available?",
                    answer: "Yes! MuzikaX is available as a mobile web app that works on both iOS and Android devices. Simply visit muzikax.com on your mobile browser and add it to your home screen for a native app-like experience."
                },
                {
                    question: "Do I need to pay to use MuzikaX?",
                    answer: "Basic features like browsing music, creating playlists, and following artists are completely free. We offer premium subscription plans for additional features like ad-free listening, offline downloads, and higher audio quality."
                }
            ]
        },
        {
            title: "For Artists & Creators",
            icon: "🎵",
            questions: [
                {
                    question: "How do I upload my music to MuzikaX?",
                    answer: "First, you'll need to upgrade to a creator account. Once approved, go to your dashboard and click 'Upload Track'. You'll need to provide track information, upload your audio file, and add artwork. Make sure you have the rights to all content you upload."
                },
                {
                    question: "What audio formats do you support?",
                    answer: "We support MP3, WAV, FLAC, and AAC formats. For the best quality, we recommend uploading high-bitrate files (320kbps MP3 or higher quality lossless formats). Maximum file size is 100MB per track."
                },
                {
                    question: "How much money can I make from my music?",
                    answer: "Earnings depend on your number of streams and your subscription tier. Premium subscribers generate higher payouts per stream. We offer transparent reporting so you can track your earnings in real-time through your creator dashboard."
                },
                {
                    question: "Can I update my uploaded tracks?",
                    answer: "Yes, you can edit track metadata, descriptions, and artwork through your dashboard. For major changes like replacing audio files, please contact our artist support team for assistance."
                }
            ]
        },
        {
            title: "Technical Support",
            icon: "🔧",
            questions: [
                {
                    question: "The app isn't loading properly. What should I do?",
                    answer: "Try clearing your browser cache and refreshing the page. If issues persist, check your internet connection and try accessing from a different browser. For mobile users, make sure you're using the latest version of your browser."
                },
                {
                    question: "I'm having trouble playing music. How can I fix this?",
                    answer: "Check your internet connection first. Try pausing and resuming playback, or refresh the page. Make sure your browser allows autoplay. If you're using an ad blocker, try temporarily disabling it as it may interfere with playback."
                },
                {
                    question: "How do I report a bug or technical issue?",
                    answer: "You can report technical issues through our Contact page or by emailing support@muzikax.com. Please include details about your device, browser, and a description of the problem to help us resolve it quickly."
                }
            ]
        },
        {
            title: "Account & Privacy",
            icon: "🔒",
            questions: [
                {
                    question: "How do I delete my account?",
                    answer: "To delete your account, go to your profile settings and select 'Delete Account'. Please note that this action is permanent and cannot be undone. All your data, playlists, and uploaded content will be removed."
                },
                {
                    question: "Is my personal information secure?",
                    answer: "Yes, we take data security seriously. We use industry-standard encryption to protect your information and comply with privacy regulations. Read our full Privacy Policy for detailed information about how we handle your data."
                },
                {
                    question: "Can I change my username or email address?",
                    answer: "Currently, usernames cannot be changed once set. However, you can update your email address through your account settings. If you need to change your username, please contact our support team."
                }
            ]
        },
        {
            title: "Subscriptions & Payments",
            icon: "💳",
            questions: [
                {
                    question: "What payment methods do you accept?",
                    answer: "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. All transactions are processed securely through our payment partners."
                },
                {
                    question: "How do I cancel my premium subscription?",
                    answer: "You can cancel your subscription anytime through your account settings. Navigate to 'Subscription' and click 'Cancel Subscription'. Your premium benefits will continue until the end of your current billing period."
                },
                {
                    question: "Do you offer refunds?",
                    answer: "We offer refunds within 14 days of purchase if you haven't used premium features extensively. Please contact our support team with your request and order details."
                }
            ]
        }
    ];
    const quickLinks = [
        { title: "Terms of Use", href: "/terms", icon: "📝" },
        { title: "Privacy Policy", href: "/privacy", icon: "🔒" },
        { title: "Contact Support", href: "/contact", icon: "💬" },
        { title: "About MuzikaX", href: "/about", icon: "ℹ️" }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-900 text-white", children: [_jsx("div", { className: "bg-gradient-to-r from-primary to-primary-light py-16", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl md:text-5xl font-bold mb-4", children: "Frequently Asked Questions" }), _jsx("p", { className: "text-xl text-white/90 max-w-3xl mx-auto", children: "Find answers to common questions about MuzikaX. Can't find what you're looking for?" }), _jsx("div", { className: "mt-4", children: _jsx(Link, { href: "/contact", className: "inline-block bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors", children: "Contact Support" }) })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [_jsxs("div", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center text-primary", children: "Quick Links" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: quickLinks.map((link, index) => (_jsxs(Link, { href: link.href, className: "bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700 text-center hover:bg-gray-700/30 transition-all duration-300 group", children: [_jsx("div", { className: "text-3xl mb-3", children: link.icon }), _jsx("h3", { className: "font-semibold text-white group-hover:text-primary transition-colors", children: link.title })] }, index))) })] }), _jsx("div", { className: "space-y-8", children: faqCategories.map((category, categoryIndex) => (_jsxs("div", { className: "bg-gray-800/30 backdrop-blur-lg rounded-xl border border-gray-700 overflow-hidden", children: [_jsx("div", { className: "bg-gray-700/30 px-6 py-4 border-b border-gray-700", children: _jsxs("h2", { className: "text-2xl font-bold flex items-center", children: [_jsx("span", { className: "mr-3 text-3xl", children: category.icon }), category.title] }) }), _jsx("div", { className: "divide-y divide-gray-700", children: category.questions.map((faq, index) => {
                                        const questionIndex = categoryIndex * 100 + index;
                                        return (_jsxs("div", { className: "px-6", children: [_jsxs("button", { onClick: () => toggleQuestion(questionIndex), className: "w-full py-6 text-left flex justify-between items-center hover:bg-gray-700/20 rounded-lg px-4 -mx-4 transition-colors", children: [_jsx("span", { className: "font-semibold text-lg text-white pr-4", children: faq.question }), _jsx("svg", { className: `w-6 h-6 text-primary transition-transform duration-300 ${openQuestion === questionIndex ? 'rotate-180' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }) })] }), _jsx("div", { className: `overflow-hidden transition-all duration-300 ${openQuestion === questionIndex ? 'max-h-96 pb-6' : 'max-h-0'}`, children: _jsx("div", { className: "pl-4 pr-12 text-gray-300 leading-relaxed", children: faq.answer }) })] }, index));
                                    }) })] }, categoryIndex))) }), _jsxs("div", { className: "mt-16 bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-8 border border-primary/20 text-center", children: [_jsx("h2", { className: "text-2xl font-bold mb-4 text-primary", children: "Still Need Help?" }), _jsx("p", { className: "text-gray-300 mb-6 max-w-2xl mx-auto", children: "Our support team is here to help you with any questions that aren't covered in our FAQ. We typically respond within 24 hours." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsxs(Link, { href: "/contact", className: "bg-gradient-to-r from-primary to-primary-light text-white px-8 py-3 rounded-full font-semibold hover:from-[#ff3a55] hover:to-[#ffb819] transition-all duration-300 inline-flex items-center justify-center", children: [_jsx("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" }) }), "Contact Support"] }), _jsxs("a", { href: "mailto:support@muzikax.com", className: "border border-gray-600 text-gray-300 px-8 py-3 rounded-full font-semibold hover:bg-gray-700/50 transition-colors inline-flex items-center justify-center", children: [_jsx("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }), "Email Support"] })] })] }), _jsxs("div", { className: "mt-12 bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700", children: [_jsx("h2", { className: "text-2xl font-bold mb-4 text-center text-primary", children: "Community Resources" }), _jsxs("div", { className: "grid md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl mb-3", children: "\uD83D\uDCDA" }), _jsx("h3", { className: "font-semibold mb-2 text-white", children: "Help Center" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Browse our comprehensive guides and tutorials" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl mb-3", children: "\uD83D\uDC65" }), _jsx("h3", { className: "font-semibold mb-2 text-white", children: "Community Forum" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Connect with other MuzikaX users and creators" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl mb-3", children: "\uD83D\uDCFA" }), _jsx("h3", { className: "font-semibold mb-2 text-white", children: "Video Tutorials" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Watch step-by-step video guides for all features" })] })] })] })] })] }));
}
