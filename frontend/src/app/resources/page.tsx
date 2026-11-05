"use client";

import { useState } from "react";
import Link from "next/link";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  type: "Guide" | "Template" | "Tool" | "Course";
  content: string;
  downloadUrl?: string;
  externalLink?: string;
}

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeResource, setActiveResource] = useState<string | null>(null);

  const resources: Resource[] = [
    {
      id: "artist-contract-template",
      title: "Artist Agreement Template",
      description: "Professional contract template for artists working with producers, collaborators, and distributors. Includes standard clauses for royalties, rights, and obligations.",
      category: "Legal",
      difficulty: "Beginner",
      type: "Template",
      content: `This comprehensive artist agreement template covers essential legal protections for musicians entering professional relationships. The template includes customizable sections for various scenarios including recording agreements, collaboration contracts, and distribution deals.

**Key Sections Included:**
- Party identification and definitions
- Grant of rights and licensing terms
- Royalty structures and payment schedules
- Term and termination conditions
- Indemnification and liability provisions
- Dispute resolution mechanisms
- Force majeure clauses

**Usage Guidelines:**
Always consult with a qualified entertainment lawyer before signing any contract. This template serves as a starting point and should be modified to fit specific circumstances and local legal requirements.

**Customization Notes:**
- Adjust royalty percentages based on industry standards
- Modify territorial restrictions as needed
- Include specific performance obligations
- Add project-specific deadlines and deliverables`,
      downloadUrl: "/downloads/artist-agreement-template.docx"
    },
    {
      id: "music-production-checklist",
      title: "Music Production Workflow Checklist",
      description: "Step-by-step checklist for professional music production from initial concept to final master, ensuring quality control at every stage.",
      category: "Production",
      difficulty: "Intermediate",
      type: "Guide",
      content: `Professional music production requires systematic attention to detail at every stage. This comprehensive checklist ensures nothing gets overlooked during the creative process.

**Pre-Production Phase:**
□ Define project scope and timeline
□ Set budget and resource allocation
□ Select appropriate recording environment
□ Test and calibrate all equipment
□ Prepare session templates and presets
□ Backup all project files

**Recording Phase:**
□ Check microphone placement and levels
□ Monitor headphone mixes for performers
□ Record multiple takes for critical sections
□ Capture room tone and ambient sounds
□ Label and organize all audio files
□ Document tempo and key information

**Editing Phase:**
□ Clean up audio (remove noise, clicks, pops)
□ Edit timing and pitch corrections
□ Arrange song structure and flow
□ Create alternate versions and stems
□ Check phase relationships between tracks
□ Verify sample rate and bit depth consistency

**Mixing Phase:**
□ Establish proper gain staging
□ Apply EQ and compression appropriately
□ Create spatial imaging with panning
□ Add effects and automation
□ Check mono compatibility
□ Reference against commercial releases

**Mastering Phase:**
□ Final level adjustment and limiting
□ Stereo enhancement and widening
□ Format preparation for distribution
□ Quality control across different playback systems
□ Metadata embedding and ISRC codes
□ Delivery preparation for all platforms`,
      downloadUrl: "/downloads/production-checklist.pdf"
    },
    {
      id: "social-media-strategy",
      title: "Social Media Marketing Strategy Guide",
      description: "Complete framework for building and maintaining effective social media presence as a musician, including content calendars and engagement tactics.",
      category: "Marketing",
      difficulty: "Beginner",
      type: "Guide",
      content: `Building a sustainable social media presence requires strategic planning and consistent execution. This guide provides a framework for musicians to effectively leverage social platforms for career growth.

**Platform Selection Strategy:**
Focus on 2-3 primary platforms where your target audience is most active rather than spreading yourself thin across all platforms. For most musicians, this typically includes Instagram, TikTok, and either Twitter or Facebook.

**Content Pillar Framework:**
1. **Behind-the-Scenes Content** - Studio sessions, creative process, daily life
2. **Performance Content** - Live performances, rehearsals, concert footage
3. **Educational Content** - Music tips, industry insights, gear reviews
4. **Community Content** - Fan interactions, collaborations, responses to trends
5. **Promotional Content** - New releases, merchandise, upcoming shows

**Posting Schedule Template:**
- Monday: Motivational quote or behind-the-scenes
- Tuesday: Performance video or snippet
- Wednesday: Educational content or tutorial
- Thursday: Fan engagement or community post
- Friday: New music teaser or release announcement
- Saturday: Weekend vibes or personal content
- Sunday: Weekly recap or reflection

**Engagement Best Practices:**
- Respond to comments within 2-4 hours when possible
- Use platform-specific features (stories, reels, lives)
- Collaborate with other artists and creators
- Participate in relevant hashtag communities
- Share user-generated content from fans
- Cross-promote between platforms strategically

**Analytics and Optimization:**
Track key metrics including reach, engagement rate, follower growth, and conversion rates. Use insights to refine content strategy monthly and adjust posting times based on when your audience is most active.`,
      downloadUrl: "/downloads/social-media-strategy.pdf"
    },
    {
      id: "royalty-calculator",
      title: "Music Royalty Calculator Tool",
      description: "Interactive spreadsheet tool for calculating potential earnings from streaming, downloads, sync licensing, and live performances across different platforms and territories.",
      category: "Business",
      difficulty: "Intermediate",
      type: "Tool",
      content: `Understanding music royalty calculations is crucial for financial planning and career sustainability. This calculator helps artists project earnings across multiple revenue streams.

**Streaming Revenue Calculation:**
The tool calculates earnings based on:
- Platform-specific payout rates (Spotify ~$0.003-$0.005 per stream)
- Geographic distribution of plays
- Premium vs. free tier ratios
- Monthly listener growth projections

**Sync Licensing Estimator:**
Estimates potential sync fees based on:
- Usage type (film, TV, advertisement, video game)
- Territory and duration of use
- Production budget categories
- Artist experience level

**Live Performance Revenue:**
Calculates potential touring income including:
- Guaranteed fees vs. percentage splits
- Travel and accommodation costs
- Merchandise sales projections
- Local market size and venue capacities

**Download Sales Projections:**
Factors in:
- Platform commission rates
- Bundle pricing strategies
- Seasonal sales patterns
- Catalog vs. new release performance

**Usage Instructions:**
Input your specific data points including current streaming numbers, average ticket prices, and typical licensing fees. The calculator provides both conservative and optimistic projections to help with financial planning and goal setting.`,
      downloadUrl: "/downloads/royalty-calculator.xlsx"
    },
    {
      id: "home-studio-setup",
      title: "Home Studio Equipment Guide",
      description: "Comprehensive guide to building professional-quality home recording setups at different budget levels, from beginner to advanced configurations.",
      category: "Production",
      difficulty: "Beginner",
      type: "Guide",
      content: `Creating a functional home studio doesn't require breaking the bank. This guide breaks down essential equipment recommendations for different budget tiers.

**Budget Tier ($500-$1,000):**
Essential equipment for getting started:
- USB audio interface (Focusrite Scarlett 2i2 ~$170)
- Large diaphragm condenser microphone (Audio-Technica AT2020 ~$100)
- Closed-back headphones (Audio-Technica ATH-M40x ~$50)
- Acoustic treatment basics (foam panels, bass traps)
- Digital Audio Workstation software (free options like GarageBand, Reaper)

**Mid-Tier ($1,500-$3,000):**
Professional-grade additions:
- Preamp-equipped audio interface
- Multiple microphone options (dynamic, ribbon, additional condensers)
- Monitor speakers (Yamaha HS5 or similar)
- Professional acoustic treatment
- MIDI controller keyboard
- External hard drives for backup

**Professional Tier ($5,000+):**
Studio-quality equipment:
- High-end audio interface with DSP processing
- Premium microphone collection
- Near-field and subwoofer monitor setup
- Professional acoustic treatment system
- Outboard gear (compressors, EQs, preamps)
- Dedicated control surface

**Room Treatment Essentials:**
- Bass traps for corners and wall junctions
- Absorption panels for first reflection points
- Diffusion elements for rear wall
- Carpet or rugs for floor treatment
- Bookshelves for natural diffusion

**Setup Tips:**
Position monitors at ear level forming equilateral triangle
Place microphones away from walls and corners
Use pop filters and shock mounts
Maintain proper cable management
Create separate areas for loud and quiet activities`,
      externalLink: "https://example.com/home-studio-guide"
    },
    {
      id: "copyright-registration",
      title: "Copyright Registration Process Guide",
      description: "Step-by-step instructions for registering musical works with copyright offices, including international considerations and timeline expectations.",
      category: "Legal",
      difficulty: "Beginner",
      type: "Guide",
      content: `Protecting your musical creations through copyright registration is essential for legal protection and monetization opportunities.

**What to Register:**
Musical compositions (lyrics and melody) and sound recordings are separate copyrightable elements that should both be registered for complete protection.

**Registration Process Steps:**
1. Complete the application form (online or paper)
2. Pay the required filing fee
3. Submit copies of the work (audio files, sheet music)
4. Wait for examination and registration certificate

**Timeline Expectations:**
Processing times vary significantly:
- Electronic filings: 3-6 months average
- Paper filings: 8-12 months average
- Expedited service: 1-2 weeks (additional fees apply)

**International Considerations:**
The Berne Convention provides automatic copyright protection in 177 countries, but registration in your home country strengthens legal positions in disputes.

**Benefits of Registration:**
- Legal presumption of ownership
- Ability to sue for infringement
- Statutory damage awards in litigation
- Enhanced licensing negotiations
- Estate planning advantages

**Maintenance Requirements:**
Copyright duration varies by jurisdiction but typically lasts for the life of the author plus 50-70 years. Renewal is generally not required for works created after 1978 in most countries.`,
      externalLink: "https://copyright.gov/registration/"
    }
  ];

  const categories = ["all", "Legal", "Production", "Marketing", "Business"];
  
  const filteredResources = activeCategory === "all" 
    ? resources 
    : resources.filter(resource => resource.category === activeCategory);

  const selectedResource = resources.find(resource => resource.id === activeResource) || resources[0];

  return (
    <div className="min-h-screen text-white bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">Artist Resources</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Professional tools, templates, and guides to help you succeed in the music industry
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
              {category === "all" ? "All Resources" : category}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Resource List */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  onClick={() => setActiveResource(resource.id)}
                  className={`bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border cursor-pointer transition-all ${
                    selectedResource.id === resource.id
                      ? "border-primary bg-gray-700/30"
                      : "border-gray-700 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        resource.type === "Guide" 
                          ? "bg-blue-900/30 text-blue-300" 
                          : resource.type === "Template"
                          ? "bg-green-900/30 text-green-300"
                          : resource.type === "Tool"
                          ? "bg-purple-900/30 text-primary-light"
                          : "bg-yellow-900/30 text-yellow-300"
                      }`}>
                        {resource.type}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        resource.difficulty === "Beginner" 
                          ? "bg-green-900/30 text-green-300" 
                          : resource.difficulty === "Intermediate"
                          ? "bg-yellow-900/30 text-yellow-300"
                          : "bg-red-900/30 text-red-300"
                      }`}>
                        {resource.difficulty}
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                      {resource.category}
                    </span>
                  </div>
                  
                  <h3 className={`font-semibold mb-2 ${
                    selectedResource.id === resource.id ? "text-primary" : "text-white"
                  }`}>
                    {resource.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm">
                    {resource.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Detail */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`px-3 py-1 font-medium rounded ${
                  selectedResource.type === "Guide" 
                    ? "bg-blue-900/30 text-blue-300" 
                    : selectedResource.type === "Template"
                    ? "bg-green-900/30 text-green-300"
                    : selectedResource.type === "Tool"
                    ? "bg-purple-900/30 text-primary-light"
                    : "bg-yellow-900/30 text-yellow-300"
                }`}>
                  {selectedResource.type}
                </span>
                <span className={`px-3 py-1 font-medium rounded ${
                  selectedResource.difficulty === "Beginner" 
                    ? "bg-green-900/30 text-green-300" 
                    : selectedResource.difficulty === "Intermediate"
                    ? "bg-yellow-900/30 text-yellow-300"
                    : "bg-red-900/30 text-red-300"
                }`}>
                  {selectedResource.difficulty}
                </span>
                <span className="px-3 py-1 bg-gray-700 text-gray-300 font-medium rounded">
                  {selectedResource.category}
                </span>
              </div>

              <h2 className="text-3xl font-bold mb-6 text-text-primary">
                {selectedResource.title}
              </h2>

              <p className="text-gray-300 mb-8 leading-relaxed text-lg">
                {selectedResource.description}
              </p>

              <div className="prose prose-invert max-w-none mb-8">
                <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedResource.content}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                {selectedResource.downloadUrl && (
                  <a
                    href={selectedResource.downloadUrl}
                    download
                    className="flex-1 bg-gradient-to-r from-primary to-primary-light text-white px-6 py-3 rounded-lg font-semibold hover:from-primary hover:to-primary-light transition-all text-center"
                  >
                    Download Resource
                  </a>
                )}
                
                {selectedResource.externalLink && (
                  <a
                    href={selectedResource.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 border border-gray-600 text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-700/50 transition-colors text-center"
                  >
                    Visit External Resource
                  </a>
                )}
                
                <button className="flex-1 border border-gray-600 text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-700/50 transition-colors">
                  Save for Later
                </button>
              </div>

              {/* Related Resources */}
              <div className="mt-12 pt-8 border-t border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-text-primary">Related Resources</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {resources
                    .filter(r => r.category === selectedResource.category && r.id !== selectedResource.id)
                    .slice(0, 2)
                    .map((related) => (
                      <div 
                        key={related.id}
                        onClick={() => setActiveResource(related.id)}
                        className="bg-gray-700/30 rounded-lg p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                      >
                        <h4 className="font-semibold text-white mb-2">{related.title}</h4>
                        <p className="text-gray-400 text-sm mb-3">{related.description}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            related.difficulty === "Beginner" 
                              ? "bg-green-900/30 text-green-300" 
                              : related.difficulty === "Intermediate"
                              ? "bg-yellow-900/30 text-yellow-300"
                              : "bg-red-900/30 text-red-300"
                          }`}>
                            {related.difficulty}
                          </span>
                          <span className="text-gray-500 text-xs">{related.type}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Categories Overview */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-8 border border-primary/20">
          <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">Resource Categories</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚖️</span>
              </div>
              <h3 className="font-semibold mb-2 text-text-primary">Legal Templates</h3>
              <p className="text-gray-300 text-sm">Contracts, agreements, and legal documents for professional music business</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎛️</span>
              </div>
              <h3 className="font-semibold mb-2 text-text-primary">Production Tools</h3>
              <p className="text-gray-300 text-sm">Workflows, checklists, and guides for professional music creation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📢</span>
              </div>
              <h3 className="font-semibold mb-2 text-text-primary">Marketing Guides</h3>
              <p className="text-gray-300 text-sm">Strategies and tactics for building your audience and brand presence</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="font-semibold mb-2 text-text-primary">Business Resources</h3>
              <p className="text-gray-300 text-sm">Financial tools, calculators, and business planning materials</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
