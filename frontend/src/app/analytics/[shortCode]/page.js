"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  Globe, 
  Clock, 
  Smartphone, 
  Monitor, 
  Compass, 
  Calendar,
  Lock,
  ExternalLink,
  RefreshCw,
  Share2
} from "lucide-react";

// Helper to parse simple OS/Browser stats from User Agent string
const parseUserAgent = (ua) => {
  if (!ua || ua === "unknown") return { device: "Desktop", browser: "Generic" };
  const lowercaseUa = ua.toLowerCase();
  
  let device = "Desktop";
  if (lowercaseUa.includes("mobi") || lowercaseUa.includes("android") || lowercaseUa.includes("iphone")) {
    device = "Mobile";
  } else if (lowercaseUa.includes("tablet") || lowercaseUa.includes("ipad")) {
    device = "Tablet";
  }

  let browser = "Other";
  if (lowercaseUa.includes("firefox")) browser = "Firefox";
  else if (lowercaseUa.includes("chrome")) browser = "Chrome";
  else if (lowercaseUa.includes("safari")) browser = "Safari";
  else if (lowercaseUa.includes("edge")) browser = "Edge";
  else if (lowercaseUa.includes("opr") || lowercaseUa.includes("opera")) browser = "Opera";

  return { device, browser };
};

export default function AnalyticsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { shortCode } = params;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/url/analytics/${shortCode}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load metrics from the database registry");
      }

      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [shortCode]);

  // Aggregate stats (Browser, Device)
  const stats = React.useMemo(() => {
    if (!data || !data.recentClicks) return { devices: {}, browsers: {} };
    
    const devices = { Mobile: 0, Desktop: 0, Tablet: 0 };
    const browsers = { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 };

    data.recentClicks.forEach(c => {
      const parsed = parseUserAgent(c.user_agent);
      devices[parsed.device] = (devices[parsed.device] || 0) + 1;
      browsers[parsed.browser] = (browsers[parsed.browser] || 0) + 1;
    });

    return { devices, browsers };
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f4f1ea] text-[#1e1f1a]">
      {/* Header */}
      <header className="border-b border-[#1e1f1a]/15 py-8 px-6 sm:px-12 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center sm:items-start">
          <Link href="/" className="font-serif text-3xl font-light tracking-wide hover:opacity-80 transition-opacity">
            ÆTHERLINK
          </Link>
          <span className="text-xs uppercase tracking-[0.25em] font-mono text-[#1e1f1a]/50 mt-1">
            Plate III. Metrics & Connection Ledgers
          </span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="border border-[#1e1f1a]/20 hover:bg-[#1e1f1a]/5 p-2.5 px-4 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Sync Metrics
          </button>
          <Link href="/" className="border border-[#1e1f1a] bg-[#1e1f1a] text-[#f4f1ea] hover:bg-sage-600 hover:border-transparent p-2.5 px-4 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Registry
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border border-[#1e1f1a] border-t-transparent animate-spin" />
            <p className="font-serif text-lg italic text-[#1e1f1a]/60">Consulting database ledger...</p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto border border-[#a33] bg-[#a33]/5 text-[#822] p-8 text-center mt-12 font-serif">
            <p className="text-xl font-bold uppercase font-mono tracking-wider">Metrics Loading Error</p>
            <p className="mt-2 text-sm leading-relaxed">{error}</p>
            <Link href="/" className="inline-block mt-6 border border-[#a33]/30 px-6 py-2 uppercase font-mono text-xs hover:bg-[#a33]/10">
              Return to Registry
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            
            {/* Top Row: General info & Large Click Count */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Col-span-8: Link details & click summary */}
              <div className="lg:col-span-8 art-border bg-[#efede6] p-8 flex flex-col justify-between gap-8 relative">
                <div className="absolute top-0 right-0 w-24 h-24 halftone-overlay opacity-10 pointer-events-none" />
                
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-sage-600 font-semibold">
                    Connection Identity Card
                  </span>
                  <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-tight truncate break-all">
                    /{data.shortCode}
                  </h1>
                  <div className="flex flex-col gap-2 mt-2 font-mono text-xs text-[#1e1f1a]/70">
                    <div className="flex items-start gap-2">
                      <span className="text-[#1e1f1a]/40 font-semibold uppercase min-w-[120px]">Target Destination:</span>
                      <a href={data.originalUrl} target="_blank" rel="noopener noreferrer" className="text-sage-600 hover:text-gold-400 underline truncate flex items-center gap-1">
                        {data.originalUrl} <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#1e1f1a]/40 font-semibold uppercase min-w-[120px]">Registered On:</span>
                      <span>{new Date(data.createdAt).toLocaleString()}</span>
                    </div>
                    {data.expiresAt && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#1e1f1a]/40 font-semibold uppercase min-w-[120px]">Expires On:</span>
                        <span className="text-[#822]">{new Date(data.expiresAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-[#1e1f1a]/15 pt-8 mt-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#1e1f1a]/40">Accumulated Clicks</span>
                    <p className="font-serif text-5xl font-light text-sage-600 mt-1">{data.totalClicks}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#1e1f1a]/40">Velocity Rate</span>
                    <p className="font-serif text-3xl font-light mt-2">
                      {data.recentClicks.length > 0 ? (data.recentClicks.length / 24).toFixed(1) : 0} 
                      <span className="text-xs uppercase font-mono text-[#1e1f1a]/50 ml-1">Hits/hr</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#1e1f1a]/40">SSRF / Phishing check</span>
                    <p className="font-mono text-xs uppercase tracking-wider text-green-600 font-bold mt-3">PASSED SECURE</p>
                  </div>
                </div>
              </div>

              {/* Col-span-4: Fine Art Frame */}
              <div className="lg:col-span-4 art-border p-4 bg-[#efede6] flex flex-col justify-between gap-4">
                <div className="relative aspect-square w-full art-border-strong bg-[#1e1f1a] overflow-hidden">
                  <div className="absolute inset-0 halftone-overlay-light z-10 pointer-events-none mix-blend-overlay" />
                  <Image
                    src="/renaissance_scales.png"
                    alt="Neoclassical scales of metrics analysis"
                    fill
                    sizes="(max-width: 1024px) 100vw, 30vw"
                    className="object-cover saturate-[0.8] contrast-[1.02]"
                  />
                </div>
                <p className="font-serif text-[10px] text-[#1e1f1a]/50 text-center italic tracking-wide">
                  Plate III. Scales of redirection metrics, oil on panel, c. 1610.
                </p>
              </div>

            </div>

            {/* Split Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Browser Stats */}
              <div className="art-border bg-[#efede6] p-6 flex flex-col gap-6">
                <div className="border-b border-[#1e1f1a]/10 pb-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#1e1f1a]/40 block">Agent Breakdown</span>
                  <h3 className="font-serif text-2xl font-light mt-1">Plate IV. Browser Architectures</h3>
                </div>
                {data.recentClicks.length === 0 ? (
                  <p className="font-serif text-sm italic text-[#1e1f1a]/40 text-center py-12">No agent data compiled yet.</p>
                ) : (
                  <div className="flex flex-col gap-4 font-mono text-xs">
                    {Object.entries(stats.browsers).map(([browser, count]) => {
                      const pct = data.recentClicks.length > 0 ? (count / data.recentClicks.length) * 100 : 0;
                      return (
                        <div key={browser} className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-[#1e1f1a]/80">
                            <span className="flex items-center gap-1.5 font-bold">
                              <Compass className="w-3.5 h-3.5 text-sage-500" /> {browser}
                            </span>
                            <span>{count} click{count !== 1 && 's'} ({pct.toFixed(0)}%)</span>
                          </div>
                          {/* Progress line */}
                          <div className="w-full bg-[#f4f1ea] h-2 art-border">
                            <div className="bg-sage-500 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Device Stats */}
              <div className="art-border bg-[#efede6] p-6 flex flex-col gap-6">
                <div className="border-b border-[#1e1f1a]/10 pb-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#1e1f1a]/40 block">Hardware Breakdown</span>
                  <h3 className="font-serif text-2xl font-light mt-1">Plate V. Device Forms</h3>
                </div>
                {data.recentClicks.length === 0 ? (
                  <p className="font-serif text-sm italic text-[#1e1f1a]/40 text-center py-12">No device data compiled yet.</p>
                ) : (
                  <div className="flex flex-col gap-6 font-mono text-xs justify-center flex-1 py-4">
                    {Object.entries(stats.devices).map(([device, count]) => {
                      const pct = data.recentClicks.length > 0 ? (count / data.recentClicks.length) * 100 : 0;
                      return (
                        <div key={device} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full border border-[#1e1f1a]/15 bg-[#f4f1ea] flex items-center justify-center flex-shrink-0">
                            {device === 'Mobile' ? (
                              <Smartphone className="w-5 h-5 text-sage-500" />
                            ) : (
                              <Monitor className="w-5 h-5 text-sage-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between font-bold text-[#1e1f1a]/80 mb-1">
                              <span>{device} Platforms</span>
                              <span>{count} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-[#f4f1ea] h-2 art-border">
                              <div className="bg-sage-600 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Click Ledger Table */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-sage-600">Audit Trails</span>
                <h3 className="font-serif text-3xl font-light">Plate VI. Chronological Hit Ledgers</h3>
                <p className="font-serif text-sm text-[#1e1f1a]/50">
                  The raw chronological list of redirect events captured asynchronously.
                </p>
              </div>

              {data.recentClicks.length === 0 ? (
                <div className="art-border border-dashed p-16 text-center bg-[#efede6]/30">
                  <p className="font-serif text-lg italic text-[#1e1f1a]/40">No clicks recorded in the ledger yet.</p>
                  <p className="font-mono text-xs text-[#1e1f1a]/30 mt-2">SHARE THE SHORT LINK TO BEGIN AUDITING ACCESS</p>
                </div>
              ) : (
                <div className="overflow-x-auto art-border bg-[#efede6]">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#1e1f1a]/15 uppercase tracking-wider text-[#1e1f1a]/60 bg-[#e9ece8]/60">
                        <th className="py-4 px-6 font-semibold">Click Date & Time</th>
                        <th className="py-4 px-6 font-semibold">IP Address (Locality)</th>
                        <th className="py-4 px-6 font-semibold hidden sm:table-cell">Browser Agent</th>
                        <th className="py-4 px-6 font-semibold text-right">Device Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1f1a]/10">
                      {data.recentClicks.map((click, idx) => {
                        const parsed = parseUserAgent(click.user_agent);
                        return (
                          <tr key={idx} className="hover:bg-[#e9ece8]/30 transition-colors">
                            <td className="py-4 px-6 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-sage-500" />
                              {new Date(click.clicked_at).toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold">{click.ip_address}</span>
                            </td>
                            <td className="py-4 px-6 hidden sm:table-cell text-[#1e1f1a]/60 truncate max-w-xs">
                              {click.user_agent}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="inline-block px-2 py-0.5 border border-[#1e1f1a]/15 uppercase tracking-wider text-[10px]">
                                {parsed.device} / {parsed.browser}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e1f1a]/15 py-12 px-6 sm:px-12 bg-[#efede6] mt-20">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-serif text-xl font-light tracking-wide">ÆTHERLINK</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#1e1f1a]/40 mt-1">
              ANNO MMXXVI • The Neo-Classical Link Registry
            </span>
          </div>
          <p className="font-serif text-xs italic text-[#1e1f1a]/40">
            Audit catalog computed in real time. Powered by ioredis connection threads.
          </p>
        </div>
      </footer>
    </div>
  );
}
