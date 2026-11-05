"use client";

import { useState } from "react";
import Link from "next/link";

export default function TermsOfUse() {
  const [activeSection, setActiveSection] = useState("acceptance");

  const sections = [
    { id: "acceptance", title: "Acceptance of Terms" },
    { id: "use-of-service", title: "Use of Service" },
    { id: "user-content", title: "User Content" },
    { id: "intellectual-property", title: "Intellectual Property" },
    { id: "prohibited-activities", title: "Prohibited Activities" },
    { id: "account-security", title: "Account Security" },
    { id: "termination", title: "Termination" },
    { id: "disclaimer", title: "Disclaimer of Warranties" },
    { id: "limitation", title: "Limitation of Liability" },
    { id: "changes", title: "Changes to Terms" },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen text-white bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">Terms of Use</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents - Sticky sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-text-primary">Table of Contents</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block text-left w-full px-3 py-2 rounded-lg transition-all ${
                      activeSection === section.id
                        ? "bg-primary text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
              
              <section id="acceptance" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">1. Acceptance of Terms</h2>
                <p className="text-gray-300 mb-4">
                  By accessing or using MuzikaX ("the Service", "we", "us", or "our"), you agree to be bound by these Terms of Use ("Terms"). If you disagree with any part of these terms, you may not access the Service.
                </p>
                <p className="text-gray-300">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
                </p>
              </section>

              <section id="use-of-service" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">2. Use of Service</h2>
                <p className="text-gray-300 mb-4">
                  MuzikaX provides a digital music ecosystem connecting Rwandan music creators with fans worldwide. The Service includes:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Music streaming and discovery platform</li>
                  <li>User-generated content sharing</li>
                  <li>Social networking features for music enthusiasts</li>
                  <li>Artist promotion and fan engagement tools</li>
                  <li>Digital music distribution services</li>
                </ul>
              </section>

              <section id="user-content" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">3. User Content</h2>
                <h3 className="text-xl font-semibold mb-3 text-text-primary">3.1 Content Ownership</h3>
                <p className="text-gray-300 mb-4">
                  You retain all ownership rights to the content you upload, including music, lyrics, images, and other materials ("User Content"). By uploading content to MuzikaX, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, distribute, display, and perform your content solely for the purpose of operating and promoting the Service.
                </p>
                
                <h3 className="text-xl font-semibold mb-3 text-text-primary">3.2 Content Responsibility</h3>
                <p className="text-gray-300">
                  You are solely responsible for all User Content you post. You represent and warrant that:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-2">
                  <li>You own or have the necessary rights to all content you upload</li>
                  <li>Your content does not infringe upon any third-party rights</li>
                  <li>Your content complies with all applicable laws and regulations</li>
                  <li>You have obtained proper licenses for any copyrighted material used</li>
                </ul>
              </section>

              <section id="intellectual-property" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">4. Intellectual Property</h2>
                <p className="text-gray-300 mb-4">
                  The Service and its original content, features, and functionality are owned by MuzikaX and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                </p>
                <p className="text-gray-300">
                  Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
                </p>
              </section>

              <section id="prohibited-activities" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">5. Prohibited Activities</h2>
                <p className="text-gray-300 mb-4">
                  You agree not to engage in any of the following prohibited activities:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Uploading content that violates any law or regulation</li>
                  <li>Infringing upon copyrights, trademarks, or other intellectual property rights</li>
                  <li>Harassing, abusing, or harming other users</li>
                  <li>Uploading malicious software or harmful content</li>
                  <li>Attempting to gain unauthorized access to the Service</li>
                  <li>Using the Service for any illegal or unauthorized purpose</li>
                  <li>Interfering with or disrupting the Service</li>
                </ul>
              </section>

              <section id="account-security" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">6. Account Security</h2>
                <p className="text-gray-300 mb-4">
                  You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                </p>
                <p className="text-gray-300">
                  You must notify us immediately of any breach of security or unauthorized use of your account.
                </p>
              </section>

              <section id="termination" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">7. Termination</h2>
                <p className="text-gray-300 mb-4">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>
                <p className="text-gray-300">
                  Upon termination, your right to use the Service will cease immediately. If you wish to terminate your account, you may simply discontinue using the Service.
                </p>
              </section>

              <section id="disclaimer" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">8. Disclaimer of Warranties</h2>
                <p className="text-gray-300">
                  The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
                </p>
              </section>

              <section id="limitation" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">9. Limitation of Liability</h2>
                <p className="text-gray-300">
                  In no event shall MuzikaX, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                </p>
              </section>

              <section id="changes" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">10. Changes to Terms</h2>
                <p className="text-gray-300">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
                <p className="text-gray-300 mt-4">
                  By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.
                </p>
              </section>

              {/* Contact Information */}
              <div className="mt-12 pt-8 border-t border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Contact Us</h2>
                <p className="text-gray-300 mb-4">
                  If you have any questions about these Terms of Use, please contact us:
                </p>
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <p className="text-gray-300"><strong>Email:</strong> legal@muzikax.com</p>
                  <p className="text-gray-300 mt-2"><strong>Address:</strong> Kigali, Rwanda</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
