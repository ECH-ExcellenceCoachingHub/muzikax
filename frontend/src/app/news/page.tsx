"use client";

import { useState } from "react";
import Link from "next/link";

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  tags: string[];
}

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const newsArticles: NewsArticle[] = [
    {
      id: "rwanda-music-festival",
      title: "Rwanda Hosts Historic Pan-African Music Festival",
      excerpt: "Kigali welcomed artists from 25 African countries for the largest music celebration the continent has ever seen, marking a milestone in regional cultural cooperation.",
      content: `Kigali transformed into a vibrant celebration of African musical diversity this weekend as the inaugural Pan-African Music Festival brought together over 200 artists from across the continent. The four-day event at the Kigali Convention Centre showcased the incredible range of African musical traditions while highlighting Rwanda's emergence as a continental cultural hub.

The festival featured performances spanning traditional folk music, contemporary Afrobeats, jazz fusion, and experimental genres. Notable highlights included a historic collaboration between Rwandan traditional singer Esperance Niyonzima and Senegalese mbalax legend Youssou N'Dour, creating a transcendent fusion of East and West African musical traditions.

"This festival proves that African music is not just surviving—it's thriving and evolving," said festival director Mugisha Jean Pierre. "We're witnessing a renaissance where traditional sounds meet modern innovation, creating something entirely new that speaks to our shared African identity."

The event also included industry panels discussing music business opportunities across Africa, with representatives from major streaming platforms announcing new initiatives to support African artists. Spotify revealed plans for a dedicated African Artists Development Fund, while YouTube announced expanded monetization programs for creators in emerging markets.

Local impact was equally significant, with Rwandan artists gaining unprecedented exposure to international industry professionals. Several artists secured recording contracts and collaboration opportunities during the festival's networking sessions.

The success of this inaugural event has already sparked discussions about making it an annual celebration, with preliminary talks underway for next year's edition to rotate between different African capitals, further strengthening continental cultural ties.`,
      author: "Tuyizere Dieudonne",
      date: "2024-01-20",
      category: "Events",
      readTime: "6 min read",
      image: "/placeholder-news-1.jpg",
      tags: ["Festival", "Pan-African", "Rwanda", "Collaboration"]
    },
    {
      id: "streaming-revenue",
      title: "African Music Streaming Revenue Surpasses $100 Million Mark",
      excerpt: "New industry report reveals African music streaming revenues have crossed the $100 million threshold for the first time, signaling major growth in the continent's digital music economy.",
      content: `The African music industry has reached a significant milestone, with streaming revenues surpassing $100 million annually for the first time according to new research from the African Music Business Association. This represents a 78% increase from the previous year and demonstrates the rapid digitization of music consumption across the continent.

The growth has been particularly pronounced in East Africa, where Rwanda's streaming market showed remarkable expansion. Local streaming service Boomplay reported a 120% increase in Rwandan user engagement, while international platforms like Spotify and Apple Music recorded similar growth patterns in the region.

"The numbers tell a story of changing consumer behavior," explained industry analyst Sarah Mutesi. "African audiences are increasingly choosing legal streaming options over piracy, driven by improved internet access, affordable data plans, and locally relevant content curation."

Key factors contributing to this growth include:
- Mobile money integration making payments more accessible
- Local language content gaining prominence on platforms
- Improved internet infrastructure across urban centers
- Growing smartphone adoption rates
- Government initiatives supporting creative industries

The revenue surge has translated into tangible benefits for artists. Independent Rwandan creators report earning 3-5 times more from streaming compared to traditional radio play and physical sales combined. This shift is enabling a new generation of artists to pursue music as a full-time career.

Major labels are taking notice, with three international record companies opening regional offices in Nairobi specifically to tap into the growing East African market. Local investment is also increasing, with Rwandan venture capital firms launching dedicated music technology funds.

Looking ahead, industry experts predict African streaming revenues could double again within the next three years, reaching $250 million by 2027 as 5G networks expand and rural connectivity improves.`,
      author: "Industry Report",
      date: "2024-01-18",
      category: "Industry",
      readTime: "5 min read",
      image: "/placeholder-news-2.jpg",
      tags: ["Streaming", "Revenue", "Growth", "Statistics"]
    },
    {
      id: "artist-development-program",
      title: "MuzikaX Launches Comprehensive Artist Development Initiative",
      excerpt: "New program aims to train 1,000 Rwandan artists in digital music business skills, production techniques, and international market navigation over the next two years.",
      content: `MuzikaX has announced an ambitious new initiative to strengthen Rwanda's music ecosystem through comprehensive artist development programming. The two-year program will provide training, mentorship, and resources to 1,000 emerging artists across various musical disciplines.

The initiative addresses a critical gap in Rwanda's creative economy: while the country produces talented musicians, many lack the business acumen and technical skills needed to succeed in today's digital music landscape. The program combines practical training with real-world application opportunities.

"We recognized that talent alone isn't enough," said MuzikaX CEO Tuyizere Dieudonne. "Artists need to understand everything from music production and copyright law to marketing and revenue optimization. This program gives them the complete toolkit for sustainable careers."

Program components include:
- Monthly masterclasses led by industry professionals
- One-on-one mentorship with established artists
- Access to professional recording facilities and equipment
- Business and legal education workshops
- Performance opportunities and networking events
- Digital marketing and social media training
- International market entry guidance

The curriculum was developed in partnership with Berklee College of Music and local industry experts. Sessions will be conducted in both English and Kinyarwanda to ensure accessibility for all participants.

Early enrollment has already attracted interest from artists across Rwanda's diverse musical landscape, from traditional folk musicians to contemporary pop and hip-hop creators. The program prioritizes underrepresented groups, including women artists and performers from rural areas.

Initial funding comes from a combination of corporate sponsors, government grants, and international development organizations committed to supporting African creative industries. The program's success could serve as a model for similar initiatives across the continent.

Applications open next month, with the first cohort beginning training in March 2024.`,
      author: "MuzikaX Team",
      date: "2024-01-15",
      category: "Company",
      readTime: "4 min read",
      image: "/placeholder-news-3.jpg",
      tags: ["Education", "Development", "Artists", "Program"]
    },
    {
      id: "traditional-music-documentation",
      title: "UNESCO Partners with Rwandan Institutions to Preserve Traditional Music",
      excerpt: "Major international effort launches to digitally archive Rwanda's endangered traditional musical heritage, ensuring ancient sounds survive for future generations.",
      content: `A groundbreaking partnership between UNESCO, the Rwandan Ministry of Sports and Culture, and local universities has initiated the largest effort to date to preserve Rwanda's traditional musical heritage. The five-year project aims to digitally document over 200 endangered musical traditions before they disappear.

The initiative responds to concerns that rapid modernization and cultural shifts are threatening traditional music practices that have existed for centuries. Many of these traditions exist only in the memories of elderly practitioners, creating urgency around preservation efforts.

"Our research identified dozens of musical traditions that may vanish within the next decade," explained Dr. Marie Claire Mukamana, lead researcher from the University of Rwanda. "Without immediate action, future generations will lose irreplaceable cultural treasures that connect them to their ancestors and heritage."

The project employs cutting-edge technology including:
- High-definition audio recording equipment to capture authentic performances
- 3D motion capture to document traditional dance movements
- Interactive digital archives with searchable databases
- Virtual reality experiences recreating traditional performance contexts
- Multilingual documentation in Kinyarwanda, French, and English

Community involvement remains central to the approach. Elder musicians and cultural keepers work directly with researchers to ensure accurate documentation while maintaining cultural protocols and respecting sacred traditions.

The digital archive will be freely accessible online, serving multiple purposes:
- Educational resource for schools and universities
- Research tool for ethnomusicologists
- Cultural tourism promotion
- Inspiration for contemporary artists
- Genealogical and anthropological research

Beyond preservation, the project includes capacity-building components training young Rwandans in documentation techniques, ensuring continuation of preservation efforts. Local artists are also encouraged to draw inspiration from archived materials for contemporary compositions.

Initial pilot projects focusing on royal court music and regional folk traditions have already yielded remarkable results, with several previously unknown musical forms documented for the first time. The full project launch is scheduled for later this year, with international exhibitions planned to showcase Rwanda's musical heritage globally.

"This isn't just about saving old music," noted UNESCO representative James Kimani. "It's about ensuring cultural continuity and giving future generations tools to understand their identity through the universal language of music."`,
      author: "UNESCO Press Office",
      date: "2024-01-12",
      category: "Culture",
      readTime: "7 min read",
      image: "/placeholder-news-4.jpg",
      tags: ["UNESCO", "Preservation", "Tradition", "Culture"]
    }
  ];

  const categories = ["all", "Events", "Industry", "Company", "Culture"];
  
  const filteredArticles = selectedCategory === "all" 
    ? newsArticles 
    : newsArticles.filter(article => article.category === selectedCategory);

  return (
    <div className="min-h-screen text-white bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">Music Industry News</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Stay updated with the latest developments in African music, industry trends, and cultural initiatives
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
              {category === "all" ? "All News" : category}
            </button>
          ))}
        </div>

        {/* Featured Article */}
        {filteredArticles.length > 0 && (
          <div className="mb-16">
            <div className="bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl overflow-hidden border border-primary/20">
              <div className="md:flex">
                <div className="md:w-2/3 p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-full">
                      {filteredArticles[0].category}
                    </span>
                    <span className="text-gray-300 text-sm">{filteredArticles[0].date}</span>
                  </div>
                  
                  <h2 className="text-3xl font-bold mb-4 text-text-primary">
                    <Link href={`/news/${filteredArticles[0].id}`} className="hover:text-primary transition-colors">
                      {filteredArticles[0].title}
                    </Link>
                  </h2>
                  
                  <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                    {filteredArticles[0].excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {filteredArticles[0].author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{filteredArticles[0].author}</p>
                        <p className="text-gray-400 text-sm">{filteredArticles[0].readTime}</p>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/news/${filteredArticles[0].id}`}
                      className="bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-full font-semibold hover:from-primary hover:to-primary-light transition-all"
                    >
                      Read Full Story
                    </Link>
                  </div>
                </div>
                
                <div className="md:w-1/3 bg-gray-800/30 flex items-center justify-center p-8">
                  <div className="text-6xl">📰</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.slice(1).map((article) => (
            <article 
              key={article.id} 
              className="rounded-xl overflow-hidden group mx-surface"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded-full">
                    {article.category}
                  </span>
                  <span className="text-gray-400 text-xs">{article.date}</span>
                </div>
                
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors text-text-primary">
                  <Link href={`/news/${article.id}`}>
                    {article.title}
                  </Link>
                </h3>
                
                <p className="text-gray-300 mb-4 text-sm line-clamp-3">
                  {article.excerpt}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {article.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">{article.author}</span>
                  </div>
                  
                  <span className="text-gray-400 text-xs">{article.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-8 border border-primary/20 text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">Stay Informed</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Get weekly updates on African music industry news, artist spotlights, and cultural developments delivered directly to your inbox.
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
