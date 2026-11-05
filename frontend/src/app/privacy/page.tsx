"use client";

import { useState } from "react";
import Link from "next/link";

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "information-collection", title: "Information We Collect" },
    { id: "how-we-use", title: "How We Use Your Information" },
    { id: "sharing-information", title: "Sharing Your Information" },
    { id: "data-security", title: "Data Security" },
    { id: "your-rights", title: "Your Rights" },
    { id: "cookies", title: "Cookies and Tracking" },
    { id: "children-privacy", title: "Children's Privacy" },
    { id: "international-transfer", title: "International Data Transfer" },
    { id: "changes-policy", title: "Changes to This Policy" },
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">Privacy Policy</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Protecting your personal information is our priority. This policy explains how we collect, use, and protect your data.
            </p>
            <p className="text-lg text-white/80 mt-4">
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
              
              <section id="introduction" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">1. Introduction</h2>
                <p className="text-gray-300 mb-4">
                  MuzikaX ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our digital music platform.
                </p>
                <p className="text-gray-300">
                  This policy applies to information we collect when you use our website, mobile applications, and other online products and services (collectively, the "Services") or when you otherwise interact with us.
                </p>
              </section>

              <section id="information-collection" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-text-primary">2.1 Information You Provide</h3>
                <p className="text-gray-300 mb-4">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-6">
                  <li><strong>Account Information:</strong> Name, email address, username, password, profile picture</li>
                  <li><strong>Music Content:</strong> Uploaded tracks, albums, lyrics, artwork, and metadata</li>
                  <li><strong>Communication:</strong> Messages, comments, feedback, and support requests</li>
                  <li><strong>Payment Information:</strong> Billing details when purchasing premium features</li>
                  <li><strong>Preferences:</strong> Language settings, notification preferences, playlist information</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-text-primary">2.2 Information Collected Automatically</h3>
                <p className="text-gray-300 mb-4">
                  When you access our Services, we automatically collect certain information:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-6">
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent, search queries</li>
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                  <li><strong>Technical Data:</strong> Connection speed, mobile carrier, crash reports</li>
                  <li><strong>Location Data:</strong> Approximate location based on IP address</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-text-primary">2.3 Information from Third Parties</h3>
                <p className="text-gray-300">
                  We may receive information about you from third parties, including:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-2">
                  <li>Social media platforms when you connect your accounts</li>
                  <li>Analytics providers who help us understand Service usage</li>
                  <li>Advertising partners for targeted advertising purposes</li>
                </ul>
              </section>

              <section id="how-we-use" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">3. How We Use Your Information</h2>
                <p className="text-gray-300 mb-4">
                  We use the information we collect for various purposes:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-3 ml-4">
                  <li><strong>Provide and Improve Services:</strong> Deliver music streaming, enable content sharing, personalize user experience</li>
                  <li><strong>Account Management:</strong> Create and maintain your account, authenticate your identity</li>
                  <li><strong>Communication:</strong> Send service announcements, respond to inquiries, provide customer support</li>
                  <li><strong>Analytics:</strong> Understand usage patterns, improve platform performance, develop new features</li>
                  <li><strong>Security:</strong> Detect and prevent fraud, unauthorized access, and abusive behavior</li>
                  <li><strong>Legal Compliance:</strong> Comply with applicable laws, regulations, and legal obligations</li>
                  <li><strong>Marketing:</strong> Send promotional communications (with your consent) and personalized recommendations</li>
                </ul>
              </section>

              <section id="sharing-information" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">4. Sharing Your Information</h2>
                <p className="text-gray-300 mb-4">
                  We may share your information in the following circumstances:
                </p>
                
                <h3 className="text-xl font-semibold mb-3 text-text-primary">4.1 With Your Consent</h3>
                <p className="text-gray-300 mb-4">
                  We will share your information when you have given us explicit permission to do so.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-text-primary">4.2 Service Providers</h3>
                <p className="text-gray-300 mb-4">
                  We work with trusted third-party service providers who help us operate our platform:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li>Cloud storage and hosting services</li>
                  <li>Payment processing companies</li>
                  <li>Analytics and marketing platforms</li>
                  <li>Customer support services</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-text-primary">4.3 Legal Requirements</h3>
                <p className="text-gray-300">
                  We may disclose your information if required to do so by law or in response to valid requests by public authorities.
                </p>
              </section>

              <section id="data-security" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">5. Data Security</h2>
                <p className="text-gray-300 mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and monitoring</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Employee training on data protection practices</li>
                  <li>Incident response procedures</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
                </p>
              </section>

              <section id="your-rights" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">6. Your Rights</h2>
                <p className="text-gray-300 mb-4">
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-3 ml-4">
                  <li><strong>Access:</strong> Request copies of your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Objection:</strong> Object to processing of your personal information</li>
                  <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  To exercise these rights, please contact us using the information provided below.
                </p>
              </section>

              <section id="cookies" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">7. Cookies and Tracking Technologies</h2>
                <p className="text-gray-300 mb-4">
                  We use cookies and similar tracking technologies to enhance your experience:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                  <li><strong>Essential Cookies:</strong> Necessary for basic platform functionality</li>
                  <li><strong>Performance Cookies:</strong> Help us understand how users interact with our platform</li>
                  <li><strong>Functional Cookies:</strong> Enable enhanced features and personalization</li>
                  <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements</li>
                </ul>
                <p className="text-gray-300">
                  You can control cookie preferences through your browser settings. Note that disabling certain cookies may affect platform functionality.
                </p>
              </section>

              <section id="children-privacy" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">8. Children's Privacy</h2>
                <p className="text-gray-300">
                  Our Services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                </p>
              </section>

              <section id="international-transfer" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">9. International Data Transfer</h2>
                <p className="text-gray-300">
                  Your information may be transferred to and maintained on computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction. We will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy.
                </p>
              </section>

              <section id="changes-policy" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">10. Changes to This Privacy Policy</h2>
                <p className="text-gray-300">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              {/* Contact Information */}
              <div className="mt-12 pt-8 border-t border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Contact Us</h2>
                <p className="text-gray-300 mb-4">
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <p className="text-gray-300"><strong>Email:</strong> privacy@muzikax.com</p>
                  <p className="text-gray-300 mt-2"><strong>Address:</strong> Kigali, Rwanda</p>
                  <p className="text-gray-300 mt-2"><strong>Data Protection Officer:</strong> dpo@muzikax.com</p>
                </div>
                
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <h3 className="font-semibold text-blue-300 mb-2 text-text-primary">Data Subject Requests</h3>
                  <p className="text-gray-300 text-sm">
                    For requests regarding your personal data rights, please email privacy@muzikax.com with subject line "Data Subject Request".
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
