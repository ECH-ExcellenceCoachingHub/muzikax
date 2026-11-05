'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
export default function Footer() {
    const currentYear = new Date().getFullYear();
    const footerLinks = {
        product: [
            { name: 'Home', href: '/' },
            { name: 'Explore', href: '/explore' },
            { name: 'Artists', href: '/artists' },
            { name: 'Playlists', href: '/playlists' },
        ],
        company: [
            { name: 'About Us', href: '/about' },
            { name: 'Careers', href: '#' },
            { name: 'Blog', href: '#' },
            { name: 'Press', href: '#' },
        ],
        support: [
            { name: 'Help Center', href: '/help' },
            { name: 'FAQ', href: '/faq' },
            { name: 'Contact Us', href: '/contact' },
            { name: 'Community', href: '/community' },
        ],
        legal: [
            { name: 'Terms of Use', href: '/terms' },
            { name: 'Privacy Policy', href: '/privacy' },
            { name: 'Copyright Policy', href: '/copyright' },
            { name: 'Cookie Policy', href: '#' },
        ],
        social: [
            { name: 'Twitter', href: '#', icon: '🐦' },
            { name: 'Instagram', href: '#', icon: '📸' },
            { name: 'Facebook', href: '#', icon: '👍' },
            { name: 'YouTube', href: '#', icon: '📺' },
        ]
    };
    return (_jsx("footer", { className: "bg-gray-900 border-t border-gray-800 w-full mt-auto", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8", children: [_jsxs("div", { className: "sm:col-span-2 md:col-span-3 lg:col-span-1", children: [_jsxs(Link, { href: "/", className: "flex items-center", children: [_jsx("img", { src: "/muzikax.png", alt: "MuzikaX Logo", className: "h-8 w-auto" }), _jsx("span", { className: "ml-3 text-xl font-bold text-white", children: "MuzikaX" })] }), _jsx("p", { className: "mt-4 text-gray-400 text-sm", children: "Connecting Rwandan music creators with fans worldwide. Discover, stream, and share the best of Rwandan music." }), _jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-4 mt-6", children: [_jsxs("div", { className: "flex items-center text-sm text-gray-400", children: [_jsx("svg", { className: "w-4 h-4 mr-2", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.42 14.97C17.73 15.55 19.16 15.93 20.03 16.06C20.08 16.07 20.12 16.07 20.16 16.07C20.96 16.07 21.6 15.43 21.6 14.63C21.6 14.59 21.6 14.55 21.59 14.5C21.46 13.64 21.08 12.21 20.5 10.9C20.25 10.31 20.33 9.62 20.71 9.17L20.72 9.16L20.72 9.15C20.87 8.99 20.93 8.76 20.88 8.54L20.87 8.46L20.8 8.18C20.69 7.64 20.36 7.18 19.9 6.91L19.89 6.9L19.87 6.89C19.63 6.75 19.36 6.7 19.09 6.7H18.91C18.64 6.7 18.37 6.75 18.13 6.89L18.1 6.91L17.82 7.08C17.56 7.24 17.36 7.48 17.24 7.76L17.23 7.78L17.22 7.8C17.1 8.08 17.05 8.39 17.08 8.69C17.15 9.58 16.66 10.4 15.9 10.86C15.84 10.9 15.77 10.93 15.7 10.96L15.69 10.97L15.67 10.97C15.42 11.07 15.14 11.05 14.91 10.93L14.88 10.92L14.86 10.91C14.58 10.79 14.35 10.56 14.23 10.28L14.22 10.26L14.21 10.24C14.09 9.96 14.09 9.65 14.21 9.37C14.67 8.43 14.9 7.39 14.9 6.3C14.9 5.84 14.72 5.39 14.39 5.05L14.37 5.03L14.35 5.01C14.01 4.68 13.56 4.5 13.1 4.5H10.9C10.44 4.5 9.99 4.68 9.65 5.01L9.63 5.03L9.61 5.05C9.28 5.39 9.1 5.84 9.1 6.3C9.1 7.39 9.33 8.43 9.79 9.37C9.91 9.65 9.91 9.96 9.79 10.24L9.78 10.26L9.77 10.28C9.65 10.56 9.42 10.79 9.14 10.91L9.12 10.92L9.09 10.93C8.86 11.05 8.58 11.07 8.33 10.97L8.31 10.97L8.3 10.96C8.23 10.93 8.16 10.9 8.09 10.86C7.34 10.4 6.85 9.58 6.92 8.69C6.95 8.39 6.9 8.08 6.78 7.8C6.66 7.48 6.46 7.24 6.18 7.08L5.9 6.91C5.44 6.64 5.11 6.18 4.99 5.64L4.93 5.36C4.88 5.14 4.74 4.95 4.54 4.85L4.46 4.82L4.38 4.81C3.6 4.78 2.96 5.42 3 6.21C3.04 7.07 3.42 8.5 3.99 9.81C4.56 11.11 5.39 12.3 6.3 13.21C7.87 14.78 9.86 15.73 12 15.73C12.07 15.73 12.14 15.73 12.21 15.72C12.44 15.71 12.66 15.78 12.84 15.92L12.86 15.94L12.88 15.95C13.06 16.1 13.17 16.32 13.17 16.55C13.17 16.89 12.92 17.18 12.58 17.22C11.73 17.32 10.86 17.26 9.99 17.04C9.12 16.82 8.29 16.45 7.53 15.95C5.4 14.58 3.83 12.6 3.08 10.37C2.7 9.16 2.7 7.84 3.08 6.63C3.46 5.42 4.28 4.4 5.39 3.75L5.47 3.7L5.55 3.68C6.78 3.23 8.14 3 9.5 3H14.5C15.86 3 17.22 3.23 18.45 3.68L18.53 3.7L18.61 3.75C19.72 4.4 20.54 5.42 20.92 6.63C21.3 7.84 21.3 9.16 20.92 10.37C20.54 11.58 19.8 12.68 18.81 13.58C18.36 14 17.84 14.36 17.27 14.65C16.7 14.94 16.09 15.15 15.46 15.28C14.83 15.41 14.18 15.46 13.54 15.43C13.2 15.41 12.87 15.32 12.57 15.17L12.5 15.13L12.44 15.08C12.29 14.96 12.1 14.91 11.91 14.95L11.85 14.97L11.79 14.98C11.46 15.03 11.17 14.85 11 14.56C10.83 14.27 10.85 13.92 11 13.66L11.02 13.62L11.04 13.59C11.15 13.4 11.34 13.27 11.56 13.24L11.6 13.23L11.64 13.23C11.8 13.24 11.94 13.31 12.04 13.42Z" }) }), _jsx("a", { href: "tel:+250793828834", className: "hover:text-primary transition-colors", children: "+250 793 828 834" })] }), _jsx("div", { className: "flex space-x-4", children: footerLinks.social.map((social) => (_jsx("a", { href: social.href, className: "text-gray-400 hover:text-primary transition-colors", "aria-label": social.name, children: _jsx("span", { className: "text-xl", children: social.icon }) }, social.name))) })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-white uppercase tracking-wider", children: "Product" }), _jsx("ul", { className: "mt-4 space-y-3", children: footerLinks.product.map((link) => (_jsx("li", { children: _jsx(Link, { href: link.href, className: "text-gray-400 hover:text-white transition-colors text-sm", children: link.name }) }, link.name))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-white uppercase tracking-wider", children: "Company" }), _jsx("ul", { className: "mt-4 space-y-3", children: footerLinks.company.map((link) => (_jsx("li", { children: _jsx(Link, { href: link.href, className: "text-gray-400 hover:text-white transition-colors text-sm", children: link.name }) }, link.name))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-white uppercase tracking-wider", children: "Support" }), _jsx("ul", { className: "mt-4 space-y-3", children: footerLinks.support.map((link) => (_jsx("li", { children: _jsx(Link, { href: link.href, className: "text-gray-400 hover:text-white transition-colors text-sm", children: link.name }) }, link.name))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-white uppercase tracking-wider", children: "Legal" }), _jsx("ul", { className: "mt-4 space-y-3", children: footerLinks.legal.map((link) => (_jsx("li", { children: _jsx(Link, { href: link.href, className: "text-gray-400 hover:text-white transition-colors text-sm", children: link.name }) }, link.name))) })] })] }), _jsx("div", { className: "mt-12 pt-8 border-t border-gray-800", children: _jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4", children: [_jsxs("p", { className: "text-gray-400 text-sm text-center md:text-left", children: ["\u00A9 ", currentYear, " MuzikaX. All rights reserved."] }), _jsx("div", { className: "flex flex-col sm:flex-row items-center gap-4", children: _jsx("span", { className: "text-gray-400 text-sm text-center", children: "Made with \u2764\uFE0F in Rwanda" }) })] }) })] }) }));
}
