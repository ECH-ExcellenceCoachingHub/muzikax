"use client";

import { useState } from "react";
import Link from "next/link";

export default function AboutUs() {
  const [activeTab, setActiveTab] = useState("mission");

  const teamMembers = [
    {
      name: "Tuyizere Dieudonne",
      role: "Co-Founder & CEO",
      bio: "Passionate about Rwandan music and technology, bringing artists and fans together through innovative digital solutions. With over 8 years in tech entrepreneurship and a deep understanding of Rwanda's creative economy, he leads MuzikaX's vision of becoming Africa's premier music platform.",
      image: "/placeholder-ceo.jpg",
      social: { twitter: "https://twitter.com/tuyizered", linkedin: "https://linkedin.com/in/tuyizered" }
    },
    {
      name: "Mugisha Jean Pierre",
      role: "Co-Founder & Head of Artist Relations",
      bio: "Award-winning music artist with deep connections in Rwanda's music industry, helping artists thrive on digital platforms. As both creator and curator, he bridges the gap between traditional Rwandan music and modern digital distribution, ensuring authentic cultural representation.",
      image: "/placeholder-team.jpg",
      social: { twitter: "https://twitter.com/jeanpierrem", linkedin: "https://linkedin.com/in/jeanpierrem" }
    },
    {
      name: "Umutesi Sarah",
      role: "Chief Technology Officer",
      bio: "Former software engineer at leading tech companies, specializing in scalable music streaming architectures. Leads our engineering team in building robust, high-performance systems that deliver seamless music experiences to users across Africa.",
      image: "/placeholder-cto.jpg",
      social: { twitter: "https://twitter.com/umutess", linkedin: "https://linkedin.com/in/umutess" }
    }
  ];

  const milestones = [
    {
      year: "2025",
      title: "Project Inception",
      description: "Tuyizere and Jean Pierre reunited with a shared vision to create a world-class music platform for Rwandan and African artists"
    },
    {
      year: "2025",
      title: "Platform Development",
      description: "Started building the foundation of MuzikaX, combining technical expertise with deep understanding of Rwandan music culture"
    },
    {
      year: "2025",
      title: "Artist Partnerships",
      description: "Began forming partnerships with local artists and music communities to shape a platform that truly serves creators"
    },
    {
      year: "2025",
      title: "Beta Launch",
      description: "Preparing for our initial beta release, focusing on delivering core features that empower artists and connect them with fans"
    }
  ];

  return (
    <div className="min-h-screen text-white bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-text-primary">About MuzikaX</h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Connecting Rwandan Music Creators with Fans Worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Mission & Vision Tabs */}
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 mb-16 border border-gray-700">
          <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-700">
            <button
              onClick={() => setActiveTab("mission")}
              className={`px-6 py-3 font-medium rounded-t-lg transition-all ${
                  activeTab === "mission"
                    ? "btn-primary text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                Our Mission
              </button>
              <button
                onClick={() => setActiveTab("vision")}
                className={`px-6 py-3 font-medium rounded-t-lg transition-all ${
                  activeTab === "vision"
                    ? "btn-primary text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                Our Vision
              </button>
              <button
                onClick={() => setActiveTab("values")}
                className={`px-6 py-3 font-medium rounded-t-lg transition-all ${
                  activeTab === "values"
                    ? "btn-primary text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                Core Values
              </button>
          </div>

          <div className="min-h-[200px]">
            {activeTab === "mission" && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Our Mission</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  To empower Rwandan and African music creators by providing them with a world-class digital platform that connects them directly with fans globally, while preserving and promoting the rich musical heritage of Rwanda and Africa.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-gray-700/30 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-text-primary">Artist Empowerment</h3>
                    <p className="text-gray-300">Providing tools and opportunities for Rwandan and African artists to showcase their talent and build sustainable careers.</p>
                  </div>
                  <div className="bg-gray-700/30 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-text-primary">Cultural Preservation</h3>
                    <p className="text-gray-300">Celebrating and preserving Rwanda's and Africa's diverse musical traditions while fostering innovation.</p>
                  </div>
                  <div className="bg-gray-700/30 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-text-primary">Global Reach</h3>
                    <p className="text-gray-300">Breaking geographical barriers to bring Rwandan and African music to audiences worldwide.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "vision" && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Our Vision</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  To become Africa's leading music platform that champions local artists while building bridges between African music and the global community, creating economic opportunities and cultural exchange.
                </p>
                <div className="mt-8 p-6 bg-gradient-to-r from-primary/20 to-primary-light/20 rounded-lg border border-primary/30">
                  <h3 className="text-xl font-semibold mb-3 text-text-primary">Long-term Goals</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Establish MuzikaX as the premier destination for African music discovery</li>
                    <li>• Support 10,000+ African artists in building sustainable music careers</li>
                    <li>• Create meaningful economic impact for music communities across Africa</li>
                    <li>• Foster cross-cultural collaboration and musical innovation</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "values" && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Core Values</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/30 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-text-primary">Artist First</h3>
                    <p className="text-gray-300">We prioritize the needs and success of music creators above all else.</p>
                  </div>
                  <div className="bg-gray-700/30 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-text-primary">Cultural Authenticity</h3>
                    <p className="text-gray-300">We celebrate genuine artistic expression and cultural diversity.</p>
                  </div>
                  <div className="bg-gray-700/30 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-text-primary">Innovation</h3>
                    <p className="text-gray-300">We continuously evolve to meet the changing needs of artists and fans.</p>
                  </div>
                  <div className="bg-gray-700/30 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-text-primary">Community</h3>
                    <p className="text-gray-300">We build meaningful connections between artists, fans, and culture.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">Our Story</h2>
          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                MuzikaX was born from an unlikely friendship between two high school classmates who shared a passion for music and technology. Tuyizere Dieudonne, a software engineer with a deep love for Rwandan culture, and Mugisha Jean Pierre, a talented musician and artist, discovered their shared vision during late-night conversations about the future of music in Rwanda.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Back in high school, both Tuyizere and Jean Pierre were active in their school's music scene—performing at events, organizing concerts, and dreaming of a day when Rwandan artists would have the global recognition they deserved. Their friendship was forged through late-night jam sessions and coding marathons, where they realized they could combine their talents to make a real difference.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                After graduating, while Tuyizere pursued his career in software engineering and Jean Pierre honed his skills as a professional musician, they never lost sight of their shared dream. In 2025, they reunited with a bold vision: to create a world-class digital platform that would empower Rwandan and African artists to reach global audiences while preserving the authenticity of their musical heritage.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                What started as a conversation between two friends has grown into a movement. Today, MuzikaX represents the perfect fusion of technical innovation and artistic passion. We're proud to support hundreds of artists in sharing their music globally while staying true to our mission of empowering creators and celebrating the rich musical traditions of Rwanda and Africa.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Our journey is just beginning, and we're excited to continue building bridges between artists and fans, technology and tradition, Rwanda and the world.
              </p>
            </div>
          </div>
        </div>

        {/* Milestones Timeline */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">Our Journey</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary to-primary-light"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                      <span className="inline-block px-3 py-1 bg-primary text-white text-sm font-medium rounded-full mb-3">
                        {milestone.year}
                      </span>
                      <h3 className="text-xl font-bold mb-2 text-text-primary">{milestone.title}</h3>
                      <p className="text-gray-300">{milestone.description}</p>
                    </div>
                  </div>
                  
                  {/* Center dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-primary rounded-full border-4 border-gray-900 z-10"></div>
                  
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pl-8' : 'pr-8'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700 text-center hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-light rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-text-primary">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                <p className="text-gray-300 text-sm mb-4">{member.bio}</p>
                <div className="flex justify-center space-x-4">
                  <a href={member.social.twitter} className="text-gray-400 hover:text-primary transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href={member.social.linkedin} className="text-gray-400 hover:text-primary transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">Our Impact</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-text-primary">Empowering Local Artists</h3>
              <p className="text-gray-300 mb-4">
                We've helped over 200 Rwandan artists reach global audiences, providing them with tools to distribute their music professionally and earn sustainable income from their creative work.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-primary mr-3">•</span>
                  <span className="text-gray-300">Zero platform fees for artist uploads</span>
                </div>
                <div className="flex items-center">
                  <span className="text-primary mr-3">•</span>
                  <span className="text-gray-300">Direct revenue sharing with artists</span>
                </div>
                <div className="flex items-center">
                  <span className="text-primary mr-3">•</span>
                  <span className="text-gray-300">Professional analytics and insights</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-text-primary">Cultural Preservation</h3>
              <p className="text-gray-300 mb-4">
                Beyond entertainment, we're actively preserving and promoting Rwanda's rich musical heritage by documenting traditional sounds, supporting cultural fusion projects, and educating global audiences about Rwandan music.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-primary mr-3">•</span>
                  <span className="text-gray-300">Traditional instrument preservation projects</span>
                </div>
                <div className="flex items-center">
                  <span className="text-primary mr-3">•</span>
                  <span className="text-gray-300">Cultural storytelling through music</span>
                </div>
                <div className="flex items-center">
                  <span className="text-primary mr-3">•</span>
                  <span className="text-gray-300">Educational partnerships with music schools</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Innovation */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">Technology & Innovation</h2>
          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">⚡</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-text-primary">High Performance</h3>
                <p className="text-gray-300 text-sm">Optimized streaming technology delivering crystal-clear audio with minimal buffering, even on limited bandwidth connections.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">🤖</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-text-primary">AI-Powered Discovery</h3>
                <p className="text-gray-300 text-sm">Intelligent recommendation algorithms that learn your taste while introducing you to authentic Rwandan and African artists.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">🌍</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-text-primary">Africa-First Design</h3>
                <p className="text-gray-300 text-sm">Built specifically for African internet conditions and user behaviors, ensuring reliable performance across diverse network environments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Community Engagement */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">Community & Partnerships</h2>
          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-text-primary">Artist Development Programs</h3>
                <p className="text-gray-300 mb-4">
                  We invest in artist growth through workshops, mentorship programs, and educational resources. Our quarterly artist development series covers everything from music production to business strategy.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <span className="text-primary mr-2">•</span>
                    Monthly production workshops
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">•</span>
                    Industry networking events
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">•</span>
                    Career development mentorship
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 text-text-primary">Strategic Partnerships</h3>
                <p className="text-gray-300 mb-4">
                  Collaborating with music institutions, cultural organizations, and technology partners to strengthen Rwanda's position in the global music industry.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <span className="text-primary mr-2">•</span>
                    Ministry of Sports & Culture partnerships
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">•</span>
                    Regional music festival collaborations
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">•</span>
                    International music industry alliances
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="text-center pt-6 border-t border-gray-700">
              <h3 className="text-lg font-bold mb-3 text-text-primary">Join Our Growing Community</h3>
              <p className="text-gray-300 mb-4 max-w-2xl mx-auto">
                Whether you're an artist looking to grow your career, a music enthusiast discovering new sounds, or a partner interested in supporting Rwanda's creative economy, there's a place for you in the MuzikaX community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/artists" className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-full font-semibold hover:from-primary hover:to-primary-light transition-all inline-flex items-center justify-center">
                  For Artists
                </Link>
                <Link href="/community" className="border border-gray-600 text-gray-300 px-6 py-3 rounded-full font-semibold hover:bg-gray-700/50 transition-colors inline-flex items-center justify-center">
                  Join Community
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-8 border border-primary/20">
          <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">By The Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-gray-300">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">200+</div>
              <div className="text-gray-300">Partner Artists</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1M+</div>
              <div className="text-gray-300">Streams Monthly</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15+</div>
              <div className="text-gray-300">Countries Reached</div>
            </div>
          </div>
        </div>

        {/* Future Vision */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">Looking Forward</h2>
          <div className="bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-8 border border-primary/20">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-text-primary">Our 2025 Vision</h3>
                <p className="text-gray-300 mb-6">
                  We're building toward a future where MuzikaX becomes the definitive platform for African music discovery and artist development. Our roadmap includes expanded features, deeper community engagement, and enhanced tools for creators.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Pan-African Expansion</h4>
                      <p className="text-gray-300 text-sm">Extending our platform to serve artists and fans across the entire African continent with localized experiences.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Advanced Creator Tools</h4>
                      <p className="text-gray-300 text-sm">Launching sophisticated analytics, fan engagement features, and monetization options for serious artists.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Cultural Heritage Projects</h4>
                      <p className="text-gray-300 text-sm">Initiating large-scale documentation and preservation projects for traditional African musical traditions.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
                <h4 className="font-semibold text-white mb-4">Stay Updated on Our Journey</h4>
                <p className="text-gray-300 text-sm mb-4">
                  Subscribe to our newsletter for exclusive updates on platform developments, artist features, and industry insights.
                </p>
                <div className="flex gap-3">
                  <input 
                    type="email" 
                    placeholder="Your email address" 
                    className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary transition-colors whitespace-nowrap">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
