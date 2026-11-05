'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SidebarLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Read initial sidebar state
    const saved = localStorage.getItem('sidebarExpanded');
    if (saved) {
      setIsSidebarExpanded(JSON.parse(saved));
    }
    
    // Listen for storage changes (in case sidebar state changes)
    const handleStorageChange = () => {
      const updated = localStorage.getItem('sidebarExpanded');
      if (updated) {
        setIsSidebarExpanded(JSON.parse(updated));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes on the same tab
    const interval = setInterval(() => {
      const updated = localStorage.getItem('sidebarExpanded');
      if (updated && JSON.parse(updated) !== isSidebarExpanded) {
        setIsSidebarExpanded(JSON.parse(updated));
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isSidebarExpanded]);
  
  if (!mounted) {
    return <>{children}</>;
  }
  
  const isPlayerPage = pathname === '/player' || pathname === '/dj'; // full-screen routes
  const isAdminPage = pathname?.startsWith('/admin');
  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  
  const hideSidebar = isPlayerPage || isAdminPage || isLoginPage || isRegisterPage;
  
  const paddingLeft = isSidebarExpanded ? 'md:pl-[200px]' : 'md:pl-[64px]';
  
  return (
    <div className={hideSidebar ? 'w-full' : `w-full ${paddingLeft} transition-all duration-300`}>
      {children}
    </div>
  );
}
