"use client";

import { useState } from "react";
import Link from "next/link";

interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  content: string;
  steps?: string[];
  tips?: string[];
}

export default function GuidesPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeGuide, setActiveGuide] = useState<string | null>(null);

  const guides: Guide[] = [
    {
      id: "music-discovery",
      title: "How to Discover New Music on MuzikaX",
      description: "Master the art of finding hidden gems and emerging artists through our platform's powerful discovery tools and personalized recommendations.",
      category: "Discovery",
      difficulty: "Beginner",
      estimatedTime: "10 minutes",
      content: `Discovering great music shouldn't feel overwhelming. MuzikaX offers several intuitive ways to find new favorites while supporting emerging artists from Rwanda and across Africa.

**Using the Explore Section**
Start with our Explore page, which features curated playlists, trending tracks, and new releases. The algorithm learns from your listening habits to surface music that matches your taste while introducing you to fresh sounds.

**Genre-Based Discovery**
Browse by genre to dive deep into specific musical styles. Each genre section showcases both established and emerging artists, making it easy to discover new voices within your preferred categories.

**Artist Recommendations**
Follow artists you love to receive notifications about similar creators. Our recommendation engine analyzes listening patterns to suggest artists with comparable styles and appeal.

**Community Playlists**
User-generated playlists often feature hidden gems that aren't widely known. Browse community-created collections to find unique music discoveries and support fellow music enthusiasts.

**Release Radar**
Enable notifications for new releases from your favorite artists and labels. This keeps you informed about fresh music while helping artists gain visibility for their latest work.`,
      steps: [
        "Navigate to the Explore section from the main menu",
        "Browse trending tracks and new releases",
        "Filter by genre to narrow your search",
        "Follow artists whose music resonates with you",
        "Create and share playlists of your discoveries",
        "Engage with the community through comments and shares"
      ]
    },
    {
      id: "playlist-creation",
      title: "Creating the Perfect Playlist",
      description: "Learn professional playlist curation techniques to create engaging collections that tell compelling musical stories and keep listeners coming back.",
      category: "Curation",
      difficulty: "Intermediate",
      estimatedTime: "20 minutes",
      content: `Great playlists do more than group songs—they tell stories, evoke emotions, and create memorable listening experiences. Whether you're curating for personal enjoyment or public sharing, these principles will elevate your playlist game.

**Define Your Purpose**
Every great playlist starts with clear intent. Are you creating workout motivation, study focus, party atmosphere, or emotional journey? Your purpose shapes song selection, arrangement, and flow.

**Consider Flow and Pacing**
Arrange tracks to create natural momentum. Start with accessible entries, build energy toward climactic moments, then provide satisfying resolution. Consider tempo, key compatibility, and emotional progression between songs.

**Balance Familiar and New**
Include recognizable favorites alongside discoveries to maintain listener engagement while introducing fresh content. The ratio depends on your audience—personal playlists can be more experimental, while public playlists benefit from familiar anchors.

**Quality Over Quantity**
Focus on cohesive storytelling rather than exhaustive completeness. A well-curated 20-song playlist often impacts listeners more than a scattered 100-song collection lacking thematic unity.

**Regular Maintenance**
Update playlists to keep them fresh and relevant. Remove tracks that no longer fit your vision, add new discoveries, and adjust sequencing based on how the collection evolves over time.`,
      tips: [
        "Use descriptive, intriguing titles that hint at the playlist's mood or story",
        "Write compelling descriptions that help listeners understand what to expect",
        "Consider seasonal or situational themes for timely relevance",
        "Test your playlist by listening straight through multiple times",
        "Pay attention to transitions between songs for seamless flow",
        "Analyze listener engagement to understand what resonates most"
      ]
    },
    {
      id: "artist-promotion",
      title: "Promoting Your Music Effectively",
      description: "Comprehensive strategies for independent artists to maximize their reach, build authentic audiences, and achieve sustainable growth in today's digital music landscape.",
      category: "Marketing",
      difficulty: "Advanced",
      estimatedTime: "45 minutes",
      content: `Successful music promotion requires strategic thinking, consistent effort, and authentic audience building rather than chasing quick viral moments. These time-tested approaches help artists build sustainable careers while maintaining creative integrity.

**Foundation Building**
Before promoting individual releases, establish your core identity and audience. Develop consistent visual branding, define your unique sound, and build email lists of engaged fans who want to support your journey.

**Multi-Platform Strategy**
Don't put all efforts into one platform. Maintain presence across relevant channels—streaming services, social media, your website, and live performances—while ensuring consistent messaging and quality across all touchpoints.

**Content Marketing Approach**
Share behind-the-scenes content, creative processes, and personal stories that humanize your artistry. Educational content about your craft, industry insights, and collaborative processes builds deeper connections with your audience.

**Strategic Release Timing**
Plan releases around optimal timing for your audience and industry calendar. Consider seasonal factors, avoid competing with major releases, and align with relevant cultural moments or events that amplify your message.

**Community Engagement**
Focus on building genuine relationships rather than transactional promotion. Respond to comments, engage with other artists, participate in relevant conversations, and show appreciation for your supporters' loyalty and support.

**Data-Driven Optimization**
Use analytics to understand what resonates with your audience. Track streaming patterns, engagement rates, demographic data, and conversion metrics to refine your approach and allocate resources effectively.

**Long-term Relationship Building**
Sustainable promotion focuses on cultivating lasting relationships with fans, industry professionals, and collaborators. Quick wins are nice, but consistent value delivery and authentic connection drive long-term success.`,
      steps: [
        "Establish your unique artistic identity and core message",
        "Build email lists and direct communication channels with fans",
        "Develop content calendar for consistent, valuable sharing",
        "Engage authentically with your community across platforms",
        "Plan strategic release campaigns with clear objectives",
        "Analyze performance data to optimize future efforts",
        "Maintain consistent quality and authentic communication"
      ]
    },
    {
      id: "audio-quality",
      title: "Improving Audio Quality for Streaming",
      description: "Technical guide to optimizing your music's sound quality for digital distribution, ensuring your artistic vision translates effectively across all streaming platforms.",
      category: "Production",
      difficulty: "Intermediate",
      estimatedTime: "30 minutes",
      content: `Professional audio quality significantly impacts how listeners perceive your music, especially in competitive streaming environments. These technical considerations help ensure your recordings maintain their intended impact across different playback systems.

**Recording Environment**
Start with proper acoustic treatment in your recording space. Even basic DIY solutions like heavy curtains, bookshelves, and foam panels can dramatically reduce unwanted reflections and room coloration that compromise recording quality.

**Equipment Considerations**
While expensive gear isn't always necessary, investing in quality microphones, audio interfaces, and monitoring systems pays dividends. Focus on reliability and consistency rather than chasing the latest trends or most expensive options.

**Recording Levels and Headroom**
Maintain proper gain staging throughout your signal chain. Record at healthy levels without clipping, leaving adequate headroom (typically -6dB to -12dB) for processing and mastering stages.

**Monitoring Practices**
Use multiple reference systems—studio monitors, headphones, consumer speakers, and even phone speakers—to evaluate how your mix translates across different playback environments. Take regular breaks to maintain objectivity during long sessions.

**Format Optimization**
Understand how different streaming platforms process audio. Some apply aggressive compression, others preserve more dynamic range. Prepare masters that sound good both with and without additional platform processing.

**Metadata and Organization**
Proper tagging, consistent naming conventions, and organized project files streamline your workflow and ensure professional presentation when submitting to distributors and platforms.`,
      tips: [
        "Trust your ears over meters and technical specifications",
        "Reference professional releases in your genre for quality benchmarks",
        "Take breaks during mixing to maintain fresh perspective",
        "Test mixes on multiple playback systems before finalizing",
        "Consider professional mastering for critical releases",
        "Document your processes for consistent results across projects"
      ]
    }
  ];

  const categories = ["all", "Discovery", "Curation", "Marketing", "Production"];
  
  const filteredGuides = activeCategory === "all" 
    ? guides 
    : guides.filter(guide => guide.category === activeCategory);

  const selectedGuide = guides.find(guide => guide.id === activeGuide) || guides[0];

  return (
    <div className="min-h-screen text-white bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">Music Guides & Resources</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Expert guides to help you discover, create, and share music more effectively
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
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeCategory === category
                  ? "bg-primary text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {category === "all" ? "All Guides" : category}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Guide List */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {filteredGuides.map((guide) => (
                <div
                  key={guide.id}
                  onClick={() => setActiveGuide(guide.id)}
                  className={`bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border cursor-pointer transition-all ${
                    selectedGuide.id === guide.id
                      ? "border-primary bg-gray-700/30"
                      : "border-gray-700 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      guide.difficulty === "Beginner" 
                        ? "bg-green-900/30 text-green-300" 
                        : guide.difficulty === "Intermediate"
                        ? "bg-yellow-900/30 text-yellow-300"
                        : "bg-red-900/30 text-red-300"
                    }`}>
                      {guide.difficulty}
                    </span>
                    <span className="text-xs text-gray-400">{guide.estimatedTime}</span>
                  </div>
                  
                  <h3 className={`font-semibold mb-2 ${
                    selectedGuide.id === guide.id ? "text-primary" : "text-white"
                  }`}>
                    {guide.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm">
                    {guide.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Guide Content */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-4 py-2 bg-primary/20 text-primary font-medium rounded-full">
                  {selectedGuide.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    selectedGuide.difficulty === "Beginner" 
                      ? "bg-green-900/30 text-green-300" 
                      : selectedGuide.difficulty === "Intermediate"
                      ? "bg-yellow-900/30 text-yellow-300"
                      : "bg-red-900/30 text-red-300"
                  }`}>
                    {selectedGuide.difficulty}
                  </span>
                  <span className="text-gray-400 text-sm">{selectedGuide.estimatedTime}</span>
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-6 text-text-primary">
                {selectedGuide.title}
              </h2>

              <p className="text-gray-300 mb-8 leading-relaxed text-lg">
                {selectedGuide.description}
              </p>

              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedGuide.content}
                </div>
              </div>

              {selectedGuide.steps && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4 text-text-primary">Key Steps:</h3>
                  <ol className="space-y-3">
                    {selectedGuide.steps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 mt-1">
                          {index + 1}
                        </span>
                        <span className="text-gray-300 pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {selectedGuide.tips && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4 text-text-primary">Pro Tips:</h3>
                  <ul className="space-y-2">
                    {selectedGuide.tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-3 mt-1">•</span>
                        <span className="text-gray-300">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Actions */}
              <div className="mt-12 pt-8 border-t border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-lg font-semibold hover:from-primary hover:to-primary-light transition-all">
                    Save Guide for Later
                  </button>
                  <button className="flex-1 border border-gray-600 text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-700/50 transition-colors">
                    Share This Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-8 border border-primary/20">
          <h2 className="text-2xl font-bold mb-4 text-center text-text-primary">Additional Learning Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-semibold mb-2 text-text-primary">Video Tutorials</h3>
              <p className="text-gray-400 text-sm">Step-by-step visual guides for hands-on learning</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-semibold mb-2 text-text-primary">Industry Reports</h3>
              <p className="text-gray-400 text-sm">Latest trends and insights from music industry experts</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="font-semibold mb-2 text-text-primary">Community Forums</h3>
              <p className="text-gray-400 text-sm">Connect with other creators and share experiences</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
