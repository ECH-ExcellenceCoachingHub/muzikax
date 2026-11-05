"use client";

import Link from "next/link";

export default function TestStylePage() {
  return (
    <div className="min-h-screen text-foreground p-8 bg-background">
      <h1 className="text-3xl font-bold mb-4 text-text-primary">Style Test Page</h1>
      <p className="mb-4">This page tests if Tailwind styles are working correctly.</p>
      
      <div className="bg-primary text-white p-4 rounded-lg mb-4">
        This should have a primary background color
      </div>
      
      <div className="bg-accent text-dark p-4 rounded-lg mb-4">
        This should have an accent background color
      </div>
      
      <button className="btn-primary px-4 py-2 rounded-md">
        This should be a primary button
      </button>
      
      <div className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
