"use client";

import { useState } from "react";
import Link from "next/link";

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState<string>("general");

  const helpCategories = [
    {
      id: "general",
      title: "General Help",
      icon: "📖",
      items: [
        {
          title: "Getting Started with MuzikaX",
          description: "Learn the basics of using MuzikaX, from creating an account to exploring music.",
          link: "/faq",
          linkText: "View FAQ"
        },
        {
          title: "Navigating the Platform",
          description: "Understand how to navigate through different sections like Explore, Charts, Playlists, and Community.",
          link: "/explore",
          linkText: "Start Exploring"
        },
        {
          title: "Account Settings",
          description: "Manage your profile, privacy settings, notification preferences, and account security.",
          link: "/settings",
          linkText: "Go to Settings"
        }
      ]
    },
    {
      id: "listeners",
      title: "For Listeners",
      icon: "🎧",
      items: [
        {
          title: "Creating & Managing Playlists",
          description: "Learn how to create, edit, and share your custom playlists with friends.",
          link: "/playlists",
          linkText: "View Playlists"
        },
        {
          title: "Discovering New Music",
          description: "Find new tracks, artists, and albums based on your listening preferences.",
          link: "/discover",
          linkText: "Discover Music"
        },
        {
          title: "Using the Audio Player",
          description: "Master the audio player features including shuffle, repeat, queue, and stem playback.",
          link: "/faq",
          linkText: "Read Guide"
        },
        {
          title: "Offline Listening",
          description: "Download your favorite tracks for offline listening with a premium subscription.",
          link: "/premium",
          linkText: "Learn About Premium"
        }
      ]
    },
    {
      id: "artists",
      title: "For Artists & Creators",
      icon: "🎵",
      items: [
        {
          title: "Uploading Your Music",
          description: "Step-by-step guide to uploading tracks, albums, and beats to MuzikaX.",
          link: "/upload",
          linkText: "Upload Music"
        },
        {
          title: "Artist Dashboard",
          description: "Access analytics, track performance, and manage your artist profile.",
          link: "/dashboard",
          linkText: "View Dashboard"
        },
        {
          title: "Monetization & Earnings",
          description: "Understand how to earn money from your music and track your revenue.",
          link: "/monetization",
          linkText: "Learn More"
        },
        {
          title: "Stem Separation & Processing",
          description: "Learn about our AI-powered stem separation technology and how to use it.",
          link: "/faq",
          linkText: "Read Guide"
        }
      ]
    },
    {
      id: "technical",
      title: "Technical Support",
      icon: "🔧",
      items: [
        {
          title: "Troubleshooting Playback Issues",
          description: "Solve common audio playback problems and improve streaming quality.",
          link: "/faq",
          linkText: "View Solutions"
        },
        {
          title: "Browser Compatibility",
          description: "Check supported browsers and optimize your browsing experience.",
          link: "/faq",
          linkText: "Learn More"
        },
        {
          title: "Mobile App Usage",
          description: "Tips for using MuzikaX on mobile devices and adding to home screen.",
          link: "/faq",
          linkText: "Read Guide"
        },
        {
          title: "Report a Bug",
          description: "Found an issue? Report it to our technical team for quick resolution.",
          link: "/contact",
          linkText: "Report Bug"
        }
      ]
    },
    {
      id: "billing",
      title: "Billing & Subscriptions",
      icon: "💳",
      items: [
        {
          title: "Premium Subscription Plans",
          description: "Compare our subscription tiers and find the perfect plan for you.",
          link: "/premium",
          linkText: "View Plans"
        },
        {
          title: "Payment Methods",
          description: "Accepted payment methods and how to update your billing information.",
          link: "/settings",
          linkText: "Update Payment"
        },
        {
          title: "Refund Policy",
          description: "Understand our refund policy and how to request a refund.",
          link: "/faq",
          linkText: "Read Policy"
        },
        {
          title: "Cancel Subscription",
          description: "Learn how to cancel your subscription and what happens to your data.",
          link: "/settings",
          linkText: "Manage Subscription"
        }
      ]
    },
    {
      id: "safety",
      title: "Safety & Privacy",
      icon: "🔒",
      items: [
        {
          title: "Privacy Settings",
          description: "Control who can see your profile, playlists, and listening activity.",
          link: "/settings",
          linkText: "Privacy Settings"
        },
        {
          title: "Account Security",
          description: "Enable two-factor authentication and secure your account.",
          link: "/settings",
          linkText: "Security Settings"
        },
        {
          title: "Report Inappropriate Content",
          description: "Learn how to report content that violates our community guidelines.",
          link: "/contact",
          linkText: "Report Content"
        },
        {
          title: "Data Protection",
          description: "Understand how we protect your personal data and comply with regulations.",
          link: "/privacy",
          linkText: "Privacy Policy"
        }
      ]
    }
  ];

  const quickActions = [
    { title: "Search Help Articles", icon: "🔍", action: "search", href: "/search" },
    { title: "Contact Support", icon: "💬", action: "contact", href: "/contact" },
    { title: "View FAQ", icon: "❓", action: "faq", href: "/faq" },
    { title: "Community Forum", icon: "👥", action: "community", href: "/community" }
  ];

  const currentCategory = helpCategories.find(cat => cat.id === activeCategory);

  return (
    <div className="min-h-screen text-white bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">Help Center</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Find answers, guides, and support for everything MuzikaX
            </p>
            <div className="mt-6 max-w-2xl mx-auto">
              <Link 
                href="/search" 
                className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-4 flex items-center gap-3 hover:bg-white/30 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <span className="text-white/80">Search help articles...</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link 
                key={index}
                href={action.href}
                className="rounded-xl p-6 text-center group mx-surface"
              >
                <div className="text-3xl mb-3">{action.icon}</div>
                <h3 className="font-semibold group-hover:text-primary transition-colors text-text-primary">
                  {action.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Category Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl border border-gray-700 p-4 sticky top-4">
              <h3 className="text-lg font-bold mb-4 text-text-primary">Help Categories</h3>
              <div className="space-y-2">
                {helpCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                      activeCategory === category.id
                        ? "bg-gradient-to-r from-primary/20 to-primary-light/10 border border-primary/30 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/30"
                    }`}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-medium text-sm">{category.title}</span>
                  </button>
                ))}
              </div>

              {/* Additional Resources */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Additional Resources</h4>
                <div className="space-y-2">
                  <Link href="/terms" className="block text-sm text-gray-400 hover:text-primary transition-colors">
                    Terms of Use
                  </Link>
                  <Link href="/privacy" className="block text-sm text-gray-400 hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/copyright" className="block text-sm text-gray-400 hover:text-primary transition-colors">
                    Copyright Policy
                  </Link>
                  <Link href="/about" className="block text-sm text-gray-400 hover:text-primary transition-colors">
                    About MuzikaX
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentCategory && (
              <div>
                <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl border border-gray-700 overflow-hidden mb-8">
                  <div className="bg-gray-700/30 px-6 py-4 border-b border-gray-700">
                    <h2 className="text-2xl font-bold flex items-center text-text-primary">
                      <span className="mr-3 text-3xl">{currentCategory.icon}</span>
                      {currentCategory.title}
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid gap-6">
                      {currentCategory.items.map((item, index) => (
                        <div 
                          key={index} 
                          className="bg-gray-700/20 rounded-lg p-6 border border-gray-600/50 hover:border-primary/30 transition-all duration-300"
                        >
                          <h3 className="text-xl font-semibold mb-2 text-text-primary">{item.title}</h3>
                          <p className="text-gray-300 mb-4">{item.description}</p>
                          <Link 
                            href={item.link}
                            className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors font-medium"
                          >
                            {item.linkText}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Related Categories */}
                <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl border border-gray-700 p-6">
                  <h3 className="text-xl font-bold mb-4 text-text-primary">Related Help Topics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {helpCategories
                      .filter(cat => cat.id !== activeCategory)
                      .slice(0, 4)
                      .map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className="flex items-center gap-3 p-4 bg-gray-700/20 rounded-lg hover:bg-gray-700/40 transition-all duration-200 text-left"
                        >
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h4 className="font-semibold text-white">{category.title}</h4>
                            <p className="text-sm text-gray-400">{category.items.length} articles</p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-8 border border-primary/20 text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">Still Need Help?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is ready to help you with any questions or issues.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="bg-gradient-to-r from-primary to-primary-light text-white px-8 py-3 rounded-full font-semibold hover:from-primary hover:to-primary-light transition-all duration-300 inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              Contact Support
            </Link>
            
            <Link 
              href="/faq" 
              className="border border-gray-600 text-gray-300 px-8 py-3 rounded-full font-semibold hover:bg-gray-700/50 transition-colors inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              View FAQ
            </Link>
          </div>
        </div>

        {/* Help Statistics */}
        <div className="mt-12 bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">Help Center Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-400 text-sm">Help Articles</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-light mb-2">24h</div>
              <div className="text-gray-400 text-sm">Average Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-gray-400 text-sm">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-light mb-2">24/7</div>
              <div className="text-gray-400 text-sm">Support Available</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
