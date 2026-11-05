'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function ConditionalSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  const isAdminPage = pathname?.startsWith('/admin');
  const isPlayerPage = pathname === '/player' || pathname === '/dj';
  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  
  // Admin routes render their own sidebar from src/app/admin/layout.tsx.
  if (isAdminPage || isPlayerPage || isLoginPage || isRegisterPage) {
    return null;
  }
  
  return <Sidebar />;
}
