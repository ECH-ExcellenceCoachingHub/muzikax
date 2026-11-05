"use client";

import { useState } from "react";
import Link from "next/link";

interface ArtistSpotlight {
  id: string;
  name: string;
  genre: string;
  bio: string;
  achievements: string[];
  interview: {
    question: string;
    answer: string;
  }[];
  imageUrl: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    spotify?: string;
    youtube?: string;
  };
}

export default function ArtistSpotlightPage() {
  const [activeArtist, setActiveArtist] = useState<string | null>(null);
  
  const featuredArtists: ArtistSpotlight[] = [
    {
      id: "bruce-melody",
      name: "Bruce Melody",
      genre: "Afrobeats, Hip-Hop",
      bio: "Bruce Melody is one of Rwanda's most influential contemporary artists, known for his unique blend of traditional Rwandan sounds with modern Afrobeats and hip-hop. His music addresses social issues while celebrating Rwandan culture, making him a voice for his generation.",
      achievements: [
        "Multiple award-winning artist in East Africa",
        "Over 50 million streams across platforms",
        "Featured in international music festivals",
        "Collaborated with artists across Africa and Europe",
        "Advocate for youth empowerment through music"
      ],
      interview: [
        {
          question: "What inspired you to pursue music as a career?",
          answer: "Growing up in Rwanda, I was surrounded by incredible traditional music, but I always felt drawn to tell contemporary stories. Music became my way of expressing the experiences of young Rwandans navigating modern life while honoring our heritage. I realized that through music, I could bridge generations and cultures."
        },
        {
          question: "How do you balance traditional Rwandan elements with modern sounds?",
          answer: "It's about respect and intention. I don't just sample traditional instruments for aesthetic purposes—I study their cultural significance and history. When I incorporate Ingoma drums or Intore dancing rhythms, it's because they carry meaning that enhances the story I'm telling. The traditional elements ground the music in our identity while modern production makes it accessible to global audiences."
        },
        {
          question: "What challenges have you faced as a Rwandan artist?",
          answer: "Early on, there was skepticism about whether Rwandan music could compete internationally. Infrastructure was limited—recording studios were expensive, distribution networks were weak, and there wasn't much industry support. But these challenges forced us to be innovative. We learned to produce high-quality music with limited resources and found creative ways to reach audiences directly through social media."
        },
        {
          question: "What advice would you give to emerging artists?",
          answer: "Focus on authenticity over trends. Your unique perspective is your greatest asset. Invest in developing your craft consistently rather than chasing viral moments. Build genuine relationships with your audience—they're your foundation for sustainable success. And never stop learning, both about music and the business side of the industry."
        }
      ],
      imageUrl: "/placeholder-artist-1.jpg",
      socialLinks: {
        instagram: "https://instagram.com/brucemelody",
        twitter: "https://twitter.com/brucemelody",
        spotify: "https://spotify.com/artist/brucemelody",
        youtube: "https://youtube.com/brucemelody"
      }
    },
    {
      id: "king-james",
      name: "King James",
      genre: "Afrobeats, R&B",
      bio: "King James has established himself as Rwanda's premier Afrobeats artist, with a smooth vocal style that blends seamlessly with infectious rhythms. His romantic ballads and upbeat anthems have earned him a devoted fanbase across Africa and beyond.",
      achievements: [
        "Rwanda's biggest Afrobeats star",
        "Billboard chart appearances",
        "Endorsed by major international brands",
        "Performed at sold-out venues across Africa",
        "Mentor to emerging Rwandan artists"
      ],
      interview: [
        {
          question: "How did you develop your distinctive vocal style?",
          answer: "My voice naturally gravitated toward melodic styles, but I spent years studying different genres to find my sweet spot. I drew inspiration from classic soul singers, contemporary Afrobeats artists, and even Rwandan traditional vocalists. The key was finding the intersection where my natural tone meets the emotional delivery that connects with listeners."
        },
        {
          question: "What role does storytelling play in your music?",
          answer: "Every song is a story I want people to feel. Whether it's about love, ambition, or overcoming challenges, I try to paint vivid pictures with my lyrics. My goal is for listeners to see themselves in my songs—to feel understood and less alone in their experiences. The melodies carry the emotion, but the stories create lasting connections."
        },
        {
          question: "How has your success impacted the Rwandan music scene?",
          answer: "I hope my success shows young Rwandan artists that our music belongs on the world stage. When I started, there were doubts about whether Rwandan artists could achieve international recognition. Now, labels and investors are paying attention to our market. More importantly, young artists see that success is possible while staying true to our cultural identity."
        },
        {
          question: "What's next for your career?",
          answer: "I'm working on expanding beyond just music—fashion collaborations, acting opportunities, and eventually launching my own record label to support emerging talent. But the music always comes first. I'm currently in the studio working on my most personal project yet, exploring themes of growth, legacy, and what it means to represent Rwanda on the global stage."
        }
      ],
      imageUrl: "/placeholder-artist-2.jpg",
      socialLinks: {
        instagram: "https://instagram.com/iamkingjames",
        twitter: "https://twitter.com/iamkingjames",
        spotify: "https://spotify.com/artist/kingjames",
        youtube: "https://youtube.com/kingjamesofficial"
      }
    },
    {
      id: "miss-shanel",
      name: "Miss Shanel",
      genre: "Afropop, Dancehall",
      bio: "Miss Shanel brings fierce energy and unapologetic confidence to Rwanda's music scene. Known for her powerful vocals and commanding stage presence, she's breaking barriers as one of the country's leading female artists in a traditionally male-dominated industry.",
      achievements: [
        "First Rwandan female artist to chart internationally",
        "Women Empowerment Award recipient",
        "Fashion icon with signature style",
        "Headlined major festivals across Africa",
        "Advocate for gender equality in music"
      ],
      interview: [
        {
          question: "What motivated you to enter the music industry?",
          answer: "I saw a gap that needed filling. When I looked at Rwanda's music scene, I noticed women were often relegated to background vocals or traditional roles. I wanted to show that female artists could be front and center—powerful, successful, and in control of their narrative. Music gave me the platform to challenge stereotypes and inspire other women to pursue their dreams boldly."
        },
        {
          question: "How do you navigate being a woman in the music industry?",
          answer: "It requires extra resilience and strategic thinking. I've learned to be assertive about my worth while maintaining professionalism. Having a strong team that respects my vision is crucial. I also make it a point to support other female artists—when we lift each other up, we all rise. The industry is slowly changing, and I'm proud to be part of that evolution."
        },
        {
          question: "Your style is quite distinctive. How does fashion relate to your music?",
          answer: "Style and sound are inseparable for me. My fashion choices reflect the confidence and attitude in my music. When I'm on stage, every element—from my outfit to my choreography to my vocal delivery—should communicate the same message of strength and authenticity. Fashion becomes another instrument in my artistic expression."
        },
        {
          question: "What legacy do you hope to leave?",
          answer: "I want to be remembered as someone who opened doors for the next generation of female artists. Beyond the music, I hope my journey shows young Rwandan women that they can be bold, ambitious, and successful while staying true to themselves. Success isn't about fitting into predefined boxes—it's about creating your own path and inspiring others to do the same."
        }
      ],
      imageUrl: "/placeholder-artist-3.jpg",
      socialLinks: {
        instagram: "https://instagram.com/miss_shanel",
        twitter: "https://twitter.com/miss_shanel",
        spotify: "https://spotify.com/artist/missshanel",
        youtube: "https://youtube.com/missshaneltv"
      }
    }
  ];

  const selectedArtist = featuredArtists.find(artist => artist.id === activeArtist) || featuredArtists[0];

  return (
    <div className="min-h-screen text-white bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">Artist Spotlight</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              In-depth interviews and stories from Rwanda's most influential music creators
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Artist Selection */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {featuredArtists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => setActiveArtist(artist.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                selectedArtist.id === artist.id
                  ? "bg-primary text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {artist.name}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Artist Profile */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary-light rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {selectedArtist.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-text-primary">{selectedArtist.name}</h2>
                <p className="text-primary font-medium">{selectedArtist.genre}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-text-primary">Achievements</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    {selectedArtist.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-text-primary">Follow</h3>
                  <div className="flex justify-center gap-3">
                    {selectedArtist.socialLinks.instagram && (
                      <a href={selectedArtist.socialLinks.instagram} className="w-10 h-10 bg-[#E4405F] rounded-full flex items-center justify-center hover:bg-[#d03756] transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.447-.5-3.297-1.45a4.19 4.19 0 01-1.2-3.1c0-1.15.35-2.25 1.05-3.1.7-.85 1.75-1.35 2.95-1.35 1.2 0 2.25.5 3.1 1.45.85.95 1.35 2.05 1.35 3.25 0 1.15-.5 2.25-1.45 3.1-.95.85-2.05 1.35-3.25 1.35z"/>
                        </svg>
                      </a>
                    )}
                    {selectedArtist.socialLinks.twitter && (
                      <a href={selectedArtist.socialLinks.twitter} className="w-10 h-10 bg-[#1DA1F2] rounded-full flex items-center justify-center hover:bg-[#0d8bd9] transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    )}
                    {selectedArtist.socialLinks.spotify && (
                      <a href={selectedArtist.socialLinks.spotify} className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center hover:bg-[#18a04a] transition-colors">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.62-.299.6-.9 1.021-1.5 1.021z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interview Content */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
              <h2 className="text-3xl font-bold mb-6 text-text-primary">Artist Biography</h2>
              <p className="text-gray-300 mb-8 leading-relaxed text-lg">
                {selectedArtist.bio}
              </p>

              <h2 className="text-3xl font-bold mb-6 text-text-primary">Exclusive Interview</h2>
              <div className="space-y-8">
                {selectedArtist.interview.map((qa, index) => (
                  <div key={index} className="border-l-4 border-primary pl-6">
                    <h3 className="text-xl font-semibold mb-3 text-text-primary">{qa.question}</h3>
                    <p className="text-gray-300 leading-relaxed">{qa.answer}</p>
                  </div>
                ))}
              </div>

              {/* Call to Action */}
              <div className="mt-12 pt-8 border-t border-gray-700">
                <div className="bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-6 text-center">
                  <h3 className="text-xl font-bold mb-3 text-text-primary">Listen to Their Music</h3>
                  <p className="text-gray-300 mb-4">
                    Experience {selectedArtist.name}'s artistry through their latest releases
                  </p>
                  <Link 
                    href={`/artists/${selectedArtist.id}`}
                    className="inline-block bg-gradient-to-r from-primary to-primary-light text-white px-8 py-3 rounded-full font-semibold hover:from-primary hover:to-primary-light transition-all"
                  >
                    Explore Artist Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
