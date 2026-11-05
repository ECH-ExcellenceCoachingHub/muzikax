"use client";

import { useState } from "react";
import Link from "next/link";

export default function CopyrightPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: "Copyright Overview" },
    { id: "user-content", title: "User-Generated Content" },
    { id: "platform-content", title: "Platform Content" },
    { id: "licensing", title: "Licensing" },
    { id: "dmca", title: "DMCA Policy" },
    { id: "report-violation", title: "Reporting Violations" },
    { id: "permissions", title: "Permissions" },
    { id: "contact", title: "Contact Information" },
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">Copyright Policy</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Understanding copyright protections and responsibilities on MuzikaX
            </p>
            <p className="text-lg text-white/80 mt-4">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents - Sidebar */}
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
              
              <section id="overview" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">1. Copyright Overview</h2>
                <p className="text-gray-300 mb-4">
                  MuzikaX respects the intellectual property rights of others and expects users of our platform to do the same. 
                  We operate in compliance with the Digital Millennium Copyright Act (DMCA) and other applicable copyright laws.
                </p>
                <p className="text-gray-300">
                  This policy outlines our commitment to protecting copyrighted materials and provides guidance on how to report 
                  copyright infringement on our platform.
                </p>
              </section>

              <section id="user-content" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">2. User-Generated Content</h2>
                <h3 className="text-xl font-semibold mb-3 text-text-primary">2.1 Content Ownership</h3>
                <p className="text-gray-300 mb-4">
                  Users retain ownership of the content they upload to MuzikaX, including music, lyrics, artwork, and other creative works. 
                  However, by uploading content, you grant MuzikaX a limited license to display, distribute, and promote your content 
                  through our platform.
                </p>
                
                <h3 className="text-xl font-semibold mb-3 text-text-primary">2.2 Responsibility</h3>
                <p className="text-gray-300">
                  You are solely responsible for ensuring that any content you upload does not infringe upon the copyrights of others. 
                  You must have the necessary rights, permissions, or licenses to upload and distribute any copyrighted material.
                </p>
              </section>

              <section id="platform-content" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">3. Platform Content</h2>
                <p className="text-gray-300 mb-4">
                  All platform elements including but not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Website design, layout, and user interface elements</li>
                  <li>Software code and algorithms</li>
                  <li>Logos, trademarks, and branding materials</li>
                  <li>Documentation and educational materials</li>
                  <li>Marketing materials and promotional content</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  Are the exclusive property of MuzikaX and are protected by copyright and trademark laws.
                </p>
              </section>

              <section id="licensing" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">4. Licensing</h2>
                <h3 className="text-xl font-semibold mb-3 text-text-primary">4.1 User Content License</h3>
                <p className="text-gray-300 mb-4">
                  When you upload content to MuzikaX, you grant us a worldwide, non-exclusive, royalty-free license to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Display and stream your content to other users</li>
                  <li>Distribute your content through our platform</li>
                  <li>Reproduce your content for technical purposes (encoding, caching, etc.)</li>
                  <li>Promote your content as part of our marketing efforts</li>
                  <li>Create derivative works for technical improvements</li>
                </ul>
                
                <h3 className="text-xl font-semibold mb-3 mt-6 text-text-primary">4.2 Platform License</h3>
                <p className="text-gray-300">
                  Access to MuzikaX is granted under a limited license for personal or commercial use as permitted by our Terms of Use. 
                  This license does not include any right to copy, modify, distribute, or create derivative works from our platform content.
                </p>
              </section>

              <section id="dmca" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">5. DMCA Policy</h2>
                <h3 className="text-xl font-semibold mb-3 text-text-primary">5.1 Reporting Claims</h3>
                <p className="text-gray-300 mb-4">
                  If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, 
                  you may file a complaint with our designated agent using the DMCA takedown procedure.
                </p>
                
                <h3 className="text-xl font-semibold mb-3 text-text-primary">5.2 Counter-Notification</h3>
                <p className="text-gray-300">
                  If your content was removed due to a copyright claim, you have the right to file a counter-notification. 
                  This must include specific information as required by the DMCA, including good faith statements about 
                  the misidentification or misrepresentation of the content.
                </p>
              </section>

              <section id="report-violation" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">6. Reporting Violations</h2>
                <p className="text-gray-300 mb-4">
                  To report copyright infringement, please contact our designated agent with the following information:
                </p>
                <ol className="list-decimal list-inside text-gray-300 space-y-2 ml-4">
                  <li>A physical or electronic signature of the copyright owner or authorized representative</li>
                  <li>Identification of the copyrighted work claimed to have been infringed</li>
                  <li>Identification of the material that is claimed to be infringing</li>
                  <li>Information reasonably sufficient to permit us to contact you</li>
                  <li>A statement that you have a good faith belief that use of the material is not authorized</li>
                  <li>A statement that the information in the notification is accurate</li>
                </ol>
              </section>

              <section id="permissions" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">7. Permissions</h2>
                <p className="text-gray-300 mb-4">
                  If you wish to use any platform content for purposes outside the scope of the granted license, 
                  you must obtain explicit written permission from MuzikaX.
                </p>
                <p className="text-gray-300">
                  For licensing inquiries or permissions, please contact us using the information provided below.
                </p>
              </section>

              <section id="contact" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">8. Contact Information</h2>
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <h3 className="font-semibold mb-2 text-text-primary">Copyright Agent</h3>
                  <p className="text-gray-300"><strong>Name:</strong> MuzikaX Copyright Agent</p>
                  <p className="text-gray-300"><strong>Email:</strong> copyright@muzikax.com</p>
                  <p className="text-gray-300"><strong>Address:</strong> Kigali, Rwanda</p>
                </div>
                
                <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-300 mb-2 text-text-primary">For DMCA Notifications</h3>
                  <p className="text-gray-300 text-sm">
                    Please send all DMCA takedown notices to the above email address with "DMCA Notification" in the subject line. 
                    Ensure all required information is included for a valid notification.
                  </p>
                </div>
              </section>

              {/* Related Links */}
              <div className="mt-12 pt-8 border-t border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Related Policies</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link href="/terms" className="bg-gray-700/30 hover:bg-gray-700/50 p-4 rounded-lg border border-gray-600 transition-colors">
                    <h3 className="font-semibold flex items-center text-text-primary">
                      <span className="mr-2">📄</span> Terms of Use
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">Our terms governing the use of the platform</p>
                  </Link>
                  <Link href="/privacy" className="bg-gray-700/30 hover:bg-gray-700/50 p-4 rounded-lg border border-gray-600 transition-colors">
                    <h3 className="font-semibold flex items-center text-text-primary">
                      <span className="mr-2">🔒</span> Privacy Policy
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">How we collect and protect your personal information</p>
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
