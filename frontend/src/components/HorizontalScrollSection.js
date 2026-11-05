import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState, useEffect } from 'react';
export default function HorizontalScrollSection({ title, viewAllLink, children }) {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    // Check scroll position and update button states
    const updateScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };
    // Initial check and add event listener
    useEffect(() => {
        updateScrollButtons();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', updateScrollButtons);
            return () => container.removeEventListener('scroll', updateScrollButtons);
        }
    }, []);
    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 320; // Width of typical card + gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    };
    return (_jsxs("section", { className: "w-full py-6 sm:py-8 relative", children: [_jsx("div", { className: "px-4 md:px-6", children: _jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl sm:text-2xl font-bold text-white tracking-tight", children: title }), viewAllLink && (_jsx("a", { href: viewAllLink, className: "text-primary hover:text-primary-light text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105", children: "View All" }))] }) }), _jsxs("div", { className: "relative group", children: [_jsx("div", { className: `absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}` }), _jsx("div", { className: `absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}` }), _jsx("div", { ref: scrollContainerRef, className: "flex overflow-x-auto pb-6 scrollbar-hide -mx-4 md:-mx-6 px-4 md:px-6 gap-5 md:gap-6 snap-x snap-mandatory scroll-smooth", style: { scrollbarWidth: 'none', msOverflowStyle: 'none' }, children: children }), _jsx("button", { className: `absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-800/80 backdrop-blur-lg flex items-center justify-center text-white shadow-xl hover:bg-gray-700/80 transition-all duration-300 hover:scale-110 ${canScrollLeft ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}`, onClick: () => scroll('left'), "aria-label": "Scroll left", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 19l-7-7 7-7" }) }) }), _jsx("button", { className: `absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-800/80 backdrop-blur-lg flex items-center justify-center text-white shadow-xl hover:bg-gray-700/80 transition-all duration-300 hover:scale-110 ${canScrollRight ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`, onClick: () => scroll('right'), "aria-label": "Scroll right", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5l7 7-7 7" }) }) })] })] }));
}
