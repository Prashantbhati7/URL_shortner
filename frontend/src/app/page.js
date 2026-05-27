"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link as LinkIcon, 
  ArrowRight, 
  Copy, 
  Check, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  ExternalLink,
  BarChart2,
  Lock,
  Globe,
  Clock
} from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recentLinks, setRecentLinks] = useState([]);

  // Load recent links from localStorage on client mount
  useEffect(() => {
    const saved = localStorage.getItem("aether_links");
    if (saved) {
      try {
        setRecentLinks(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved links", err);
      }
    }
  }, []);

  // Save new link to localStorage
  const saveLink = (newLink) => {
    const updated = [newLink, ...recentLinks.filter(l => l.shortCode !== newLink.shortCode)].slice(0, 10);
    setRecentLinks(updated);
    localStorage.setItem("aether_links", JSON.stringify(updated));
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/url/shorten', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          alias: alias || undefined,
          expiresAt: expiresAt || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred during link creation");
      }

      setResult(data);
      saveLink({
        originalUrl: data.originalUrl,
        shortUrl: data.shortUrl,
        shortCode: data.shortCode,
        expiresAt: data.expiresAt,
        createdAt: new Date().toISOString(),
        clicks: 0
      });
      setUrl("");
      setAlias("");
      setExpiresAt("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f4f1ea] text-[#1e1f1a]">
      {/* Editorial Header */}
      <header className="border-b border-[#1e1f1a]/15 py-8 px-6 sm:px-12 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center sm:items-start">
          <Link href="/" className="font-serif text-3xl font-light tracking-wide hover:opacity-80 transition-opacity">
            ÆTHERLINK
          </Link>
          <span className="text-xs uppercase tracking-[0.25em] font-mono text-[#1e1f1a]/50 mt-1">
            Plate I. The Neoclassical URL Registry
          </span>
        </div>
        <nav className="flex items-center gap-8 text-sm font-mono tracking-wider uppercase text-[#1e1f1a]/85">
          <Link href="/" className="hover:text-gold-400 transition-colors border-b border-[#1e1f1a]">Registry</Link>
          <a href="#recent" className="hover:text-gold-400 transition-colors">Catalog</a>
          <Link href="/auth/login" className="hover:text-gold-400 transition-colors flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> Sign In
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 md:py-20">
        
        {/* Editorial Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Panel: Form (Col: 7) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-sage-600 font-semibold">
                Connection Preservation Service
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light leading-[1.1] tracking-tight">
                Where Digital Nodes <br />
                <span className="italic font-normal text-sage-600">Meet Classical</span> Proportions.
              </h1>
              <p className="font-serif text-lg text-[#1e1f1a]/70 leading-relaxed max-w-xl mt-2">
                AetherLink compresses sprawling, high-dimensional web addresses into elegant, 
                human-centric coordinates. Beautiful redirects, immediate caching, and complete audit metrics.
              </p>
            </div>

            {/* Shortener Card */}
            <div className="art-border bg-[#efede6] p-6 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 halftone-overlay opacity-10 pointer-events-none" />
              
              <form onSubmit={handleShorten} className="flex flex-col gap-6">
                
                {/* Long URL Input */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="url" className="text-xs font-mono uppercase tracking-wider text-[#1e1f1a]/60 flex items-center gap-2">
                    <Globe className="w-3 h-3 text-sage-500" /> Original URL Coordinates
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      id="url"
                      required
                      placeholder="https://sprawling-digital-ocean.com/coordinates/long-path-name"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-[#f4f1ea] border border-[#1e1f1a]/20 px-4 py-3.5 pr-10 font-mono text-sm focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all placeholder:text-[#1e1f1a]/30"
                    />
                    <LinkIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e1f1a]/40" />
                  </div>
                </div>

                {/* Second Row: Alias & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Custom Alias */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="alias" className="text-xs font-mono uppercase tracking-wider text-[#1e1f1a]/60 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-gold-400" /> Custom Tail / Alias (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#1e1f1a]/40">/</span>
                      <input
                        type="text"
                        id="alias"
                        placeholder="my-alias"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="w-full bg-[#f4f1ea] border border-[#1e1f1a]/20 pl-7 pr-3 py-3.5 font-mono text-sm focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all placeholder:text-[#1e1f1a]/30"
                      />
                    </div>
                  </div>

                  {/* Expiration Date */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="expiresAt" className="text-xs font-mono uppercase tracking-wider text-[#1e1f1a]/60 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-sage-500" /> Expiry Threshold (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        id="expiresAt"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full bg-[#f4f1ea] border border-[#1e1f1a]/20 px-3 py-3.2 font-mono text-xs focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/20 transition-all text-[#1e1f1a]/70"
                      />
                    </div>
                  </div>

                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e1f1a] text-[#f4f1ea] py-4 uppercase font-mono tracking-widest text-xs hover:bg-sage-600 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block animate-pulse">Compiling Node Registry...</span>
                  ) : (
                    <>
                      Shorten Coordinates <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

              </form>

              {/* Error Scroll */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 border border-[#a33] bg-[#a33]/5 text-[#822] p-4 flex gap-3 items-start font-serif"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm uppercase font-mono tracking-wider">Security / Validation Alert</h4>
                      <p className="text-sm mt-1 leading-relaxed">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result Container */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 border-t border-[#1e1f1a]/15 pt-8"
                  >
                    <div className="flex flex-col gap-4 bg-[#f4f1ea] p-6 art-border">
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-sage-600 font-bold block">
                        Output Index Record
                      </span>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-[#1e1f1a]/40 truncate">
                            {result.originalUrl}
                          </p>
                          <a 
                            href={result.shortUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-serif text-xl sm:text-2xl font-light text-sage-600 hover:text-gold-400 transition-colors flex items-center gap-2 mt-1 underline break-all"
                          >
                            {result.shortUrl}
                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                          </a>
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => copyToClipboard(result.shortUrl)}
                            className="flex-1 sm:flex-initial bg-[#1e1f1a]/5 hover:bg-[#1e1f1a]/10 border border-[#1e1f1a]/20 py-2.5 px-4 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-600" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy Link
                              </>
                            )}
                          </button>
                          
                          <Link
                            href={`/analytics/${result.shortCode}`}
                            className="flex-1 sm:flex-initial bg-[#1e1f1a] text-[#f4f1ea] hover:bg-sage-600 py-2.5 px-4 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                          >
                            <BarChart2 className="w-3.5 h-3.5" /> Metrics
                          </Link>
                        </div>
                      </div>

                      {result.expiresAt && (
                        <div className="flex items-center gap-2 text-xs font-mono text-[#1e1f1a]/60 mt-2 border-t border-[#1e1f1a]/10 pt-3">
                          <Clock className="w-3.5 h-3.5 text-sage-500" /> Expires on: {new Date(result.expiresAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* Right Panel: Exhibition Framing (Col: 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* The Classical Art Frame */}
            <div className="art-border p-4 bg-[#efede6] flex flex-col gap-4">
              <div className="relative aspect-[1024/880] w-full overflow-hidden art-border-strong bg-[#1e1f1a]">
                {/* Halftone grid pattern over the image */}
                <div className="absolute inset-0 halftone-overlay-light z-10 pointer-events-none mix-blend-overlay" />
                <Image
                  src="/renaissance_exhibition.png"
                  alt="AetherLink Neoclassical Connection Exhibition"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover saturate-[0.95] scale-109"
                  priority
                />
              </div>
              <div className="font-serif text-xs text-[#1e1f1a]/60 text-center italic tracking-wide">
                Plate I. AetherLink Exhibition Hall — The Golden Node Transition, c. 2026.
              </div>
            </div>

            {/* Quick Metrics Callouts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="art-border p-4 flex flex-col justify-between h-32 bg-[#efede6] relative">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#1e1f1a]/40">Active Nodes</span>
                <span className="font-serif text-4xl font-light tracking-tight">{recentLinks.length || 0}</span>
                <span className="text-[9px] font-mono text-sage-600">Archived Locally</span>
              </div>
              <div className="art-border p-4 flex flex-col justify-between h-32 bg-[#efede6] relative">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#1e1f1a]/40">Read Speed</span>
                <span className="font-serif text-4xl font-light tracking-tight text-sage-600">&lt;100<span className="text-xs uppercase font-mono tracking-normal text-[#1e1f1a]/60 ml-0.5">ms</span></span>
                <span className="text-[9px] font-mono text-[#1e1f1a]/50">Redis Eviction Cache</span>
              </div>
            </div>

          </div>

        </div>

        {/* Section Divider */}
        <hr id="recent" className="my-20 border-t border-[#1e1f1a]/15" />

        {/* Plate II: Link Catalog / History */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-sage-600">Local Archive Catalog</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-tight">
              Plate II. Registered Redirection Records
            </h2>
            <p className="font-serif text-sm text-[#1e1f1a]/60 max-w-xl">
              A catalog of shortened links compiled in this session. Click on <span className="font-mono text-xs">METRICS</span> to examine hit volumes, geographic distribution, and device logs.
            </p>
          </div>

          {recentLinks.length === 0 ? (
            <div className="art-border border-dashed p-16 text-center bg-[#efede6]/30">
              <p className="font-serif text-lg italic text-[#1e1f1a]/40">No entries recorded in this ledger.</p>
              <p className="font-mono text-xs text-[#1e1f1a]/30 mt-2">SHORTEN A URL ABOVE TO REGISTER THE FIRST ROW</p>
            </div>
          ) : (
            <div className="overflow-x-auto art-border bg-[#efede6]">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#1e1f1a]/15 uppercase tracking-wider text-[#1e1f1a]/60 bg-[#e9ece8]/60">
                    <th className="py-4 px-6 font-semibold">Short Coordinate</th>
                    <th className="py-4 px-6 font-semibold hidden md:table-cell">Target Destination</th>
                    <th className="py-4 px-6 font-semibold text-center">Status</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1f1a]/10">
                  {recentLinks.map((link, idx) => (
                    <tr key={idx} className="hover:bg-[#e9ece8]/30 transition-colors">
                      {/* Short Link */}
                      <td className="py-4 px-6 font-serif text-base font-light text-sage-600">
                        <div className="flex flex-col font-mono text-xs gap-1">
                          <a 
                            href={link.shortUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-serif text-lg font-light text-sage-600 hover:text-gold-400 hover:underline transition-colors break-all"
                          >
                            /{link.shortCode}
                          </a>
                          <span className="text-[10px] text-[#1e1f1a]/40">Created {new Date(link.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-4 px-6 max-w-xs truncate hidden md:table-cell text-[#1e1f1a]/70">
                        {link.originalUrl}
                      </td>

                      {/* Expiration Status */}
                      <td className="py-4 px-6 text-center">
                        {link.expiresAt && new Date(link.expiresAt) < new Date() ? (
                          <span className="inline-block px-2.5 py-1 bg-[#a33]/10 text-[#822] text-[10px] uppercase font-mono tracking-wider font-semibold rounded-sm">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-[#3a3]/10 text-[#161] text-[10px] uppercase font-mono tracking-wider font-semibold rounded-sm">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => copyToClipboard(link.shortUrl)}
                            className="p-2 border border-[#1e1f1a]/15 hover:bg-[#1e1f1a]/5 transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          
                          <Link
                            href={`/analytics/${link.shortCode}`}
                            className="p-2 border border-[#1e1f1a]/15 bg-[#1e1f1a] text-[#f4f1ea] hover:bg-sage-600 hover:border-transparent transition-colors flex items-center gap-1.5 px-3 uppercase tracking-wider text-[10px] font-semibold"
                          >
                            <BarChart2 className="w-3 h-3" /> Metrics
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#1e1f1a]/15 py-12 px-6 sm:px-12 bg-[#efede6]">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-serif text-xl font-light tracking-wide">ÆTHERLINK</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#1e1f1a]/40 mt-1">
              ANNO MMXXVI • The Neo-Classical Link Registry
            </span>
          </div>
          <p className="font-serif text-sm italic text-[#1e1f1a]/50 text-center max-w-md">
            "Proportion is the heart of link architecture. Let every redirection be balanced, fast, and secure."
          </p>
          <div className="flex gap-6 text-xs font-mono uppercase tracking-wider text-[#1e1f1a]/60">
            <a href="#" className="hover:text-gold-400">Terms</a>
            <a href="#" className="hover:text-gold-400">Security</a>
            <a href="#" className="hover:text-gold-400">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
