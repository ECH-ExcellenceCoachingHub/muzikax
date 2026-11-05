"use client";

import { useState } from "react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  slug: string;
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const blogPosts: BlogPost[] = [
    {
      id: "1",
      title: "The Rise of Rwandan Afrobeats: A Cultural Revolution",
      excerpt: "Exploring how Rwandan artists are reshaping the global Afrobeats landscape with unique sounds and storytelling that blend traditional rhythms with contemporary production.",
      content: `Rwanda's music scene is experiencing an unprecedented boom, with artists creating a distinctive sound that's capturing international attention. This movement goes beyond entertainment—it's a cultural renaissance that's putting Rwanda on the global music map.

The unique blend of traditional Rwandan instruments with modern production techniques has created a sound that's both authentic and contemporary. Artists like Bruce Melody, King James, and Miss Shanel are leading this revolution, each bringing their unique perspective to the genre.

What makes Rwandan Afrobeats special is its storytelling element. Unlike mainstream Afrobeats that often focus on dance and romance, Rwandan artists incorporate social commentary, cultural pride, and narratives about everyday life in Rwanda. This authenticity resonates with both local and international audiences.

The government's support for creative industries, combined with improved internet connectivity and social media adoption, has created the perfect environment for this musical explosion. Recording studios are popping up across Kigali, and music festivals are drawing crowds from across East Africa.

Looking forward, the potential for Rwandan Afrobeats to influence global music trends is enormous. As more artists gain international recognition and collaborate with global stars, we're witnessing the birth of a truly unique musical identity that honors tradition while embracing innovation.`,
      author: "Jean Pierre Uwimana",
      date: "2024-01-15",
      category: "Culture",
      readTime: "8 min read",
      image: "/placeholder-blog-1.jpg",
      slug: "rise-of-rwandan-afrobeats"
    },
    {
      id: "2",
      title: "How Technology is Transforming Music Distribution in Africa",
      excerpt: "Examining the digital revolution that's democratizing music distribution across Africa, enabling independent artists to reach global audiences without traditional gatekeepers.",
      content: `The music industry in Africa is undergoing a digital transformation that's fundamentally changing how artists connect with audiences. Traditional record label systems are being bypassed as technology creates new pathways for independent artists to thrive.

Streaming platforms have become the primary way Africans discover and consume music. In countries with growing smartphone penetration, apps like Spotify, Boomplay, and local platforms are experiencing explosive growth. This shift has been particularly dramatic in Rwanda, where mobile internet adoption has created new opportunities for local artists.

Social media platforms have emerged as powerful tools for music promotion. Artists can now build substantial followings through TikTok, Instagram, and YouTube before ever signing with a label. Viral moments on these platforms often translate to chart success and international recognition.

The rise of mobile money systems has also revolutionized music monetization. Artists can now receive payments directly from fans across borders, eliminating traditional distribution bottlenecks. This financial accessibility has empowered thousands of independent creators.

However, challenges remain. Internet infrastructure varies significantly across the continent, piracy continues to impact revenue, and many artists struggle with digital marketing skills. Despite these obstacles, the trend toward democratized music distribution shows no signs of slowing down.

The future looks bright for African music distribution. As technology continues to improve and more artists develop digital literacy, we're likely to see even more breakthrough success stories emerging from previously underserved markets.`,
      author: "Tuyizere Dieudonne",
      date: "2024-01-10",
      category: "Technology",
      readTime: "6 min read",
      image: "/placeholder-blog-2.jpg",
      slug: "technology-transforming-african-music"
    },
    {
      id: "3",
      title: "Building Sustainable Careers: A Guide for Emerging Artists",
      excerpt: "Practical advice for musicians looking to build long-term, sustainable careers in today's competitive music industry landscape.",
      content: `Creating a sustainable career in music requires more than just talent—it demands strategic thinking, business acumen, and persistence. Today's successful artists are entrepreneurs who understand both their craft and the industry mechanics.

**Financial Planning**
The first step toward sustainability is establishing multiple revenue streams. Don't rely solely on music sales or streaming royalties. Consider live performances, merchandise, licensing deals, teaching, and brand partnerships. Many successful artists diversify their income through sync licensing for films, TV shows, and advertisements.

**Brand Development**
Your artistic brand is crucial for standing out in a crowded marketplace. Define what makes you unique—not just musically, but visually and personally. Consistent branding across all platforms helps fans recognize and connect with you. This includes everything from your visual aesthetic to how you communicate with your audience.

**Audience Building**
Focus on building genuine relationships with your fans rather than chasing vanity metrics. Engage with your community through social media, email newsletters, and live events. Create exclusive content for your most dedicated supporters through platforms like Patreon or direct fan subscriptions.

**Professional Development**
Invest in improving both your musical skills and business knowledge. Take courses in music production, marketing, contract negotiation, and financial management. Surround yourself with professionals who complement your skills—managers, booking agents, and lawyers who understand the music industry.

**Long-term Vision**
Think beyond immediate success. Set realistic goals for different phases of your career. Maybe year one focuses on building your local fanbase, year two on regional expansion, and year three on international opportunities. Document your journey and celebrate milestones along the way.

Remember that sustainable careers are built gradually. Focus on consistent growth rather than overnight success, and always prioritize the quality of your work and relationships over quick wins.`,
      author: "Sarah Mutesi",
      date: "2024-01-05",
      category: "Career",
      readTime: "10 min read",
      image: "/placeholder-blog-3.jpg",
      slug: "sustainable-careers-for-artists"
    },
    {
      id: "4",
      title: "The Art of Music Production: From Bedroom to Studio",
      excerpt: "A comprehensive guide to music production fundamentals, covering everything from basic equipment to advanced mixing techniques for aspiring producers.",
      content: `Music production has never been more accessible, yet the path from beginner to professional requires dedication and systematic learning. Today's bedroom producers have access to tools that were once only available in expensive professional studios.

**Getting Started**
You don't need thousands of dollars in equipment to begin producing quality music. A decent laptop, digital audio workstation (DAW) software, and a pair of studio headphones are sufficient to start. Popular DAW options include FL Studio, Ableton Live, Logic Pro, and GarageBand for beginners.

**Understanding the Basics**
Learn fundamental concepts like tempo, time signatures, scales, and chord progressions. Understanding music theory isn't mandatory, but it significantly accelerates your learning curve and opens creative possibilities. Start with simple loops and gradually build complexity.

**Sound Design and Sampling**
Modern production heavily relies on samples and synthesized sounds. Learn to manipulate existing sounds and create your own using synthesizers. Pay attention to frequency balance—the foundation of professional-sounding mixes. Low frequencies provide power, mid frequencies carry melody, and high frequencies add clarity.

**Arrangement and Structure**
Great songs follow proven structures while maintaining creativity. Study hit songs in your genre to understand typical arrangements. Most popular music follows verse-chorus patterns, but don't be afraid to experiment with unconventional structures that serve your artistic vision.

**Mixing Fundamentals**
Mixing is where your track comes alive. Start by setting proper levels, then add EQ to carve space for each element. Compression controls dynamics, reverb creates space, and delay adds dimension. The key is subtlety—effects should enhance, not overpower your core elements.

**Mastering and Final Polish**
Mastering prepares your track for commercial release. This involves final EQ adjustments, stereo enhancement, limiting, and ensuring consistent loudness across platforms. While professional mastering is ideal, many producers successfully self-master using reference tracks and careful listening.

The journey from bedroom producer to studio professional takes time and practice. Focus on completing projects rather than perfecting individual elements, and always trust your ears over technical specifications.`,
      author: "Alex Rutaganda",
      date: "2023-12-28",
      category: "Production",
      readTime: "12 min read",
      image: "/placeholder-blog-4.jpg",
      slug: "music-production-guide"
    }
  ];

  const categories = ["all", "Culture", "Technology", "Career", "Production"];
  
  const filteredPosts = selectedCategory === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen text-white bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">MuzikaX Blog</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Insights, stories, and resources for music creators and enthusiasts
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? "bg-primary text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {category === "all" ? "All Posts" : category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {filteredPosts.map((post) => (
            <article 
              key={post.id} 
              className="rounded-xl overflow-hidden group mx-surface"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                    {post.category}
                  </span>
                  <span className="text-gray-400 text-sm">{post.readTime}</span>
                </div>
                
                <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors text-text-primary">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                
                <p className="text-gray-300 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {post.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{post.author}</p>
                      <p className="text-gray-400 text-sm">{post.date}</p>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/blog/${post.slug}`}
                    className="text-primary hover:text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                  >
                    Read More
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-8 border border-primary/20 text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">Stay Updated</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest music industry insights, artist spotlights, and platform updates delivered to your inbox.
          </p>
          
          <div className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400"
            />
            <button className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-lg font-semibold hover:from-primary hover:to-primary-light transition-all">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
