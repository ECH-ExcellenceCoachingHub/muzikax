"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState("idle");
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus("idle");
        try {
            // Simulate form submission
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Here you would typically send the data to your backend
            console.log("Form submitted:", formData);
            setSubmitStatus("success");
            setFormData({ name: "", email: "", subject: "", message: "" });
        }
        catch (error) {
            console.error("Submission error:", error);
            setSubmitStatus("error");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const contactMethods = [
        {
            title: "General Inquiries",
            email: "info@muzikax.com",
            description: "For general questions about our platform and services"
        },
        {
            title: "Artist Support",
            email: "artists@muzikax.com",
            description: "For artists looking to join or questions about creator tools"
        },
        {
            title: "Technical Support",
            email: "support@muzikax.com",
            description: "For technical issues, bugs, or platform problems"
        },
        {
            title: "Press & Media",
            email: "press@muzikax.com",
            description: "For media inquiries, press releases, and partnership opportunities"
        }
    ];
    const faqItems = [
        {
            question: "How do I upload my music to MuzikaX?",
            answer: "Sign up for an account, complete your creator profile, then use the 'Upload' button in your dashboard to share your tracks. Make sure you have the rights to all content you upload."
        },
        {
            question: "What formats are supported for music uploads?",
            answer: "We support MP3, WAV, FLAC, and AAC formats. Maximum file size is 100MB per track. For best quality, we recommend uploading high-quality files (320kbps or higher)."
        },
        {
            question: "How does the revenue sharing work?",
            answer: "Creators earn revenue based on streams and downloads. Premium subscribers generate higher payouts per stream. Detailed analytics and earnings reports are available in your creator dashboard."
        },
        {
            question: "Can I update my uploaded tracks?",
            answer: "Yes, you can edit track metadata, artwork, and descriptions through your dashboard. For major changes like replacing audio files, please contact our artist support team."
        }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-900 text-white", children: [_jsx("div", { className: "bg-gradient-to-r from-primary to-primary-light py-16", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl md:text-5xl font-bold mb-4", children: "Contact Us" }), _jsx("p", { className: "text-xl text-white/90 max-w-3xl mx-auto", children: "Have questions or feedback? We'd love to hear from you. Get in touch with our team." })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [_jsxs("div", { className: "grid lg:grid-cols-2 gap-12", children: [_jsxs("div", { className: "bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-primary", children: "Send us a Message" }), submitStatus === "success" && (_jsx("div", { className: "mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx("svg", { className: "w-5 h-5 text-green-400 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }) }), _jsx("span", { className: "text-green-300", children: "Message sent successfully! We'll get back to you soon." })] }) })), submitStatus === "error" && (_jsx("div", { className: "mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg", children: _jsxs("div", { className: "flex items-center", children: [_jsx("svg", { className: "w-5 h-5 text-red-400 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) }), _jsx("span", { className: "text-red-300", children: "Something went wrong. Please try again." })] }) })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-300 mb-2", children: "Full Name *" }), _jsx("input", { type: "text", id: "name", name: "name", value: formData.name, onChange: handleInputChange, required: true, className: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400", placeholder: "Enter your full name" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-300 mb-2", children: "Email Address *" }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleInputChange, required: true, className: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400", placeholder: "Enter your email address" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "subject", className: "block text-sm font-medium text-gray-300 mb-2", children: "Subject *" }), _jsxs("select", { id: "subject", name: "subject", value: formData.subject, onChange: handleInputChange, required: true, className: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white", children: [_jsx("option", { value: "", children: "Select a subject" }), _jsx("option", { value: "general", children: "General Inquiry" }), _jsx("option", { value: "artist", children: "Artist Registration" }), _jsx("option", { value: "technical", children: "Technical Support" }), _jsx("option", { value: "billing", children: "Billing/Payment" }), _jsx("option", { value: "partnership", children: "Partnership Opportunity" }), _jsx("option", { value: "feedback", children: "Feedback/Suggestions" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "message", className: "block text-sm font-medium text-gray-300 mb-2", children: "Message *" }), _jsx("textarea", { id: "message", name: "message", value: formData.message, onChange: handleInputChange, required: true, rows: 6, className: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400 resize-vertical", placeholder: "Tell us how we can help you..." })] }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "w-full bg-gradient-to-r from-primary to-primary-light text-white font-semibold py-3 px-6 rounded-lg hover:from-[#ff3a55] hover:to-[#ffb819] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed", children: isSubmitting ? (_jsxs("div", { className: "flex items-center justify-center", children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Sending..."] })) : ("Send Message") })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700 mb-8", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-primary", children: "Contact Methods" }), _jsx("div", { className: "space-y-6", children: contactMethods.map((method, index) => (_jsxs("div", { className: "p-4 bg-gray-700/30 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-white mb-2", children: method.title }), _jsx("p", { className: "text-primary mb-2", children: method.email }), _jsx("p", { className: "text-gray-400 text-sm", children: method.description })] }, index))) }), _jsxs("div", { className: "mt-8 pt-6 border-t border-gray-700", children: [_jsx("h3", { className: "font-semibold text-white mb-4", children: "Contact Information" }), _jsxs("div", { className: "text-gray-300 space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-white", children: "Phone:" }), _jsx("a", { href: "tel:+250793828834", className: "text-primary hover:underline", children: "+250 793 828 834" })] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-white", children: "Office Location:" }), _jsx("p", { children: "Kigali, Rwanda" })] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-white", children: "Hours:" }), _jsx("p", { className: "text-sm text-gray-400", children: "Monday-Friday, 9:00 AM - 5:00 PM CAT" })] })] })] })] }), _jsxs("div", { className: "bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-primary", children: "Connect With Us" }), _jsxs("div", { className: "flex space-x-4", children: [_jsx("a", { href: "#", className: "flex items-center justify-center w-12 h-12 bg-[#1DA1F2] rounded-full hover:bg-[#1a91da] transition-colors", children: _jsx("svg", { className: "w-6 h-6 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" }) }) }), _jsx("a", { href: "#", className: "flex items-center justify-center w-12 h-12 bg-[#FF0000] rounded-full hover:bg-[#e60000] transition-colors", children: _jsx("svg", { className: "w-6 h-6 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" }) }) }), _jsx("a", { href: "#", className: "flex items-center justify-center w-12 h-12 bg-[#0A66C2] rounded-full hover:bg-[#0955aa] transition-colors", children: _jsx("svg", { className: "w-6 h-6 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" }) }) }), _jsx("a", { href: "#", className: "flex items-center justify-center w-12 h-12 bg-[#6E5494] rounded-full hover:bg-[#5d4780] transition-colors", children: _jsx("svg", { className: "w-6 h-6 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" }) }) })] })] })] })] }), _jsxs("div", { className: "mt-16", children: [_jsx("h2", { className: "text-3xl font-bold mb-8 text-center text-primary", children: "Frequently Asked Questions" }), _jsx("div", { className: "grid md:grid-cols-2 gap-8", children: faqItems.map((item, index) => (_jsxs("div", { className: "bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700", children: [_jsx("h3", { className: "font-semibold text-lg mb-3 text-white", children: item.question }), _jsx("p", { className: "text-gray-300", children: item.answer })] }, index))) }), _jsx("div", { className: "text-center mt-8", children: _jsxs("p", { className: "text-gray-300", children: ["Still have questions?", " ", _jsx("button", { onClick: () => { var _a; return (_a = document.getElementById('contact-form')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' }); }, className: "text-primary hover:underline font-medium", children: "Contact us directly" })] }) })] })] })] }));
}
