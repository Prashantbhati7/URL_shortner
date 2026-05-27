"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, Mail, User, Sparkles } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Recording Scholar credentials in database registry... Redirecting to Registry.");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f4f1ea] text-[#1e1f1a]">
      {/* Mini Header */}
      <header className="border-b border-[#1e1f1a]/15 py-6 px-6 sm:px-12 flex justify-between items-center">
        <Link href="/" className="font-serif text-2xl font-light tracking-wide">
          ÆTHERLINK
        </Link>
        <Link href="/" className="font-mono text-xs uppercase tracking-wider text-[#1e1f1a]/60 hover:text-[#1e1f1a] transition-colors flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Registry
        </Link>
      </header>

      {/* Auth Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-12 py-16 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-stretch">
          
          {/* Left Frame: Form Card (Col: 7) */}
          <div className="md:col-span-7 bg-[#efede6] art-border p-8 sm:p-12 flex flex-col justify-center relative">
            <div className="absolute top-0 right-0 w-24 h-24 halftone-overlay opacity-10 pointer-events-none" />
            
            <div className="flex flex-col gap-3 mb-8">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-sage-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold-400 animate-pulse" /> Register New Coordinate Thread
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-tight">
                Join the Link Academy.
              </h1>
              <p className="font-serif text-sm text-[#1e1f1a]/60">
                Establish your permanent identity in the neoclassical digital index.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#1e1f1a]/60 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-sage-500" /> Full Name / Pseudonym
                </label>
                <input
                  type="text"
                  required
                  placeholder="Scholar Erasmus"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[#1e1f1a]/20 px-4 py-3.5 font-mono text-sm focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#1e1f1a]/60 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-sage-500" /> Credential Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="scholar@aether.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[#1e1f1a]/20 px-4 py-3.5 font-mono text-sm focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#1e1f1a]/60 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-sage-500" /> Secure Passphrase
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[#1e1f1a]/20 px-4 py-3.5 font-mono text-sm focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1e1f1a] text-[#f4f1ea] py-4 uppercase font-mono tracking-widest text-xs hover:bg-sage-600 transition-colors cursor-pointer"
              >
                Inscribe New Scholar
              </button>
            </form>

            <div className="mt-8 border-t border-[#1e1f1a]/10 pt-6 text-center font-serif text-sm">
              <span className="text-[#1e1f1a]/50 italic">Already inscribed?</span>{" "}
              <Link href="/auth/login" className="text-sage-600 font-bold hover:text-gold-400 transition-colors uppercase font-mono text-xs ml-1">
                Log In
              </Link>
            </div>
          </div>

          {/* Right Frame: Painting (Col: 5) */}
          <div className="md:col-span-5 art-border p-4 bg-[#efede6] flex flex-col justify-between gap-4">
            <div className="relative aspect-[4/5] md:aspect-auto md:flex-1 w-full min-h-[300px] art-border-strong bg-[#1e1f1a] overflow-hidden">
              <div className="absolute inset-0 halftone-overlay-light z-10 pointer-events-none mix-blend-overlay" />
              <Image
                src="/renaissance_scroll.png"
                alt="Neoclassical codex scroll"
                fill
                sizes="(max-width: 768px) 100vw, 30vw"
                className="object-cover saturate-[0.8] contrast-[1.03] scale-x-[-1]" /* Flipped for layout variety */
              />
            </div>
            <p className="font-serif text-[10px] text-[#1e1f1a]/50 text-center italic tracking-wide">
              Plate VIII. Scrolls of the AetherLink authentication ledger (alt view), c. 1624.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
