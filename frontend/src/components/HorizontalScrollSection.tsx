import { ReactNode, useRef, useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface HorizontalScrollSectionProps {
  title: string;
  viewAllLink?: string;
  children: ReactNode;
  variant?: 'horizontal' | 'list';
  showRecommendedBadge?: boolean;
}

export default function HorizontalScrollSection({
  title,
  viewAllLink,
  children,
  variant = 'horizontal',
  showRecommendedBadge = false
}: HorizontalScrollSectionProps) {
  const { t } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Width of typical card + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <section className="w-full py-3 sm:py-5 relative">
      {variant === 'horizontal' ? (
        <>
          <div className="px-4 md:px-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-text-primary">
                {title}
              </h2>
              {viewAllLink && (
                <a
                  href={viewAllLink}
                  className="text-primary hover:text-primary-light text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105"
                >
                  {t('viewAll')}
                </a>
              )}
            </div>
          </div>
          
          <div className="relative group">
            {/* Left fade overlay */}
            <div className={`absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}></div>
            
            {/* Right fade overlay */}
            <div className={`absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}></div>
            
            {/* Scroll container */}
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-2 scrollbar-hide -mx-4 md:-mx-6 px-4 md:px-6 gap-3 md:gap-4 snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {children}
            </div>
            
            {/* Enhanced scroll buttons */}
            <button 
              className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-800/80 backdrop-blur-lg flex items-center justify-center text-white shadow-xl hover:bg-gray-700/80 transition-all duration-300 hover:scale-110"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <button 
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-800/80 backdrop-blur-lg flex items-center justify-center text-white shadow-xl hover:bg-gray-700/80 transition-all duration-300 hover:scale-110"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </>
      ) : (
        /* List View */
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-text-primary">
                {title}
              </h2>
              {showRecommendedBadge && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary to-primary-light text-white shadow-lg">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  For You
                </span>
              )}
            </div>
            {viewAllLink && (
              <a
                href={viewAllLink}
                className="text-primary hover:text-primary-light text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 whitespace-nowrap"
              >
                {t('viewAll')}
              </a>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {children}
          </div>
        </div>
      )}
    </section>
  );
}