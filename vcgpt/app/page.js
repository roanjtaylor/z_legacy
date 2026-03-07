"use client";

import { useState, useRef } from "react";
import PitchForm from "@/components/PitchForm";
import ScoreCard from "@/components/ScoreCard";
import FeedbackWidget from "@/components/FeedbackWidget";

export default function Home() {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const resultsRef = useRef(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setAnalysis("");
    setComplete(false);

    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 402) {
          setAnalysis("__API_KEY_EXHAUSTED__");
          setComplete(true);
          setLoading(false);
          return;
        }
        throw new Error("Analysis failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAnalysis(text);
      }

      setComplete(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setAnalysis(`> ERROR: ${err.message}\n\nPlease try again.`);
      setComplete(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero section */}
      <section className="relative w-full h-[420px] md:h-[500px] overflow-hidden">
        <img
          src="/hero.png"
          alt="VCGPT"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 tracking-tight">
            VC-GPT
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-xl">
            The AI That Replaced Your Investors
          </p>
          <p className="text-base text-white/60 mt-2">
            Sure Valley Ventures &middot; AI Investment Engine
          </p>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Form section */}
      <section className="max-w-3xl mx-auto px-4 mt-10 relative z-10">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">Pitch Your Startup</h2>
          <p className="text-base md:text-lg text-muted mb-8">Get a brutal, honest VC analysis in seconds.</p>
          <PitchForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </section>

      {/* Results section */}
      <section ref={resultsRef} className="max-w-3xl mx-auto px-4 py-10">
        {loading && !complete && (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-accent" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-muted text-base">Analysing your pitch...</span>
            </div>
            {analysis && (
              <div className="mt-4 text-left">
                <div className="w-full bg-background rounded-full h-1.5 mb-2">
                  <div className="h-1.5 rounded-full bg-accent transition-all duration-300 animate-pulse" style={{ width: "60%" }} />
                </div>
                <p className="text-xs text-muted">Streaming analysis...</p>
              </div>
            )}
          </div>
        )}

        {complete && analysis === "__API_KEY_EXHAUSTED__" && (
          <div className="bg-red-950/60 border-2 border-red-500/80 rounded-2xl p-8 md:p-10 text-center">
            <div className="text-4xl mb-4">&#9888;&#65039;</div>
            <h3 className="text-2xl font-bold text-red-400 mb-3">API Key Ran Out</h3>
            <p className="text-lg text-white/80 mb-4">
              The API credits have been exhausted. VC-GPT will be back online shortly.
            </p>
            <p className="text-base text-white/60 mb-6">
              Contact me to get this topped up for free:
            </p>
            <a
              href="mailto:roanjtaylor@gmail.com?subject=VC-GPT%20API%20Key%20Ran%20Out"
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-lg"
            >
              roanjtaylor@gmail.com
            </a>
          </div>
        )}

        {complete && analysis && analysis !== "__API_KEY_EXHAUSTED__" && (
          <>
            <ScoreCard content={analysis} />
            <div className="mt-6">
              <FeedbackWidget />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
