"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

type Business = {
  id: number;
  name: string;
  slug: string;
};

const PLACEHOLDER_BUSINESSES = [
  "car wash business",
  "salon business",
  "restaurant business",
  "boutique business",
  "hardware store",
  "pharmacy business",
  "gym business",
];

export default function HomeSearch() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<Business[]>([]);
  const [suggestionType, setSuggestionType] = useState<"popular" | "recent" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect for placeholder
  useEffect(() => {
    const baseText = "Requirements for ";
    const businessName = PLACEHOLDER_BUSINESSES[placeholderIndex];
    const fullText = baseText + businessName;

    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (displayedPlaceholder.length < fullText.length) {
        timeout = setTimeout(() => {
          setDisplayedPlaceholder(fullText.slice(0, displayedPlaceholder.length + 1));
        }, 60);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2200);
      }
    } else {
      if (displayedPlaceholder.length > baseText.length) {
        timeout = setTimeout(() => {
          setDisplayedPlaceholder(displayedPlaceholder.slice(0, -1));
        }, 35);
      } else {
        setIsDeleting(false);
        setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_BUSINESSES.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedPlaceholder, isDeleting, placeholderIndex]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/businesses/popular");
        const data = await response.json();
        if (response.ok && data.success) {
          setSearchSuggestions(data.results || []);
          setSuggestionType(data.type);
        } else {
          throw new Error(data.message || "Invalid API response");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load suggestions."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const handleSearch = (keyword: string) => {
    if (!keyword.trim()) return;
    router.push(`/search?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  // Show 3 on mobile (handled via CSS), 5 on desktop
  const mobileSuggestions = searchSuggestions.slice(0, 3);
  const desktopSuggestions = searchSuggestions.slice(0, 5);

  // Split placeholder into base + bold business name for rendering
  const BASE_TEXT = "Requirements for ";
  const boldStart = displayedPlaceholder.startsWith(BASE_TEXT)
    ? BASE_TEXT.length
    : displayedPlaceholder.length;
  const placeholderBase = displayedPlaceholder.slice(0, boldStart);
  const placeholderBold = displayedPlaceholder.slice(boldStart);

  return (
    <section className="hero-section">
      {/* Background image — right-aligned, fades left into green */}
      <div className="hero-bg-image" aria-hidden="true" />
      {/* Green-to-transparent gradient overlay */}
      <div className="hero-bg-gradient" aria-hidden="true" />

      <div className="hero-inner">
        {/* LEFT: Text + Search */}
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="hero-heading">
              Launch Your Business{" "}
              <span className="hero-brand">Smarter</span>
            </h1>

            <p className="hero-sub">
              Discover everything you need to start any business in one intelligent platform.
            </p>

            {/* Search bar */}
            <div className="search-card">
              <div className="search-input-wrap">
                {/* Custom placeholder with bold business name */}
                {!search && (
                  <span className="search-placeholder" aria-hidden="true">
                    {placeholderBase}
                    <strong>{placeholderBold}</strong>
                  </span>
                )}
                <input
                  className="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch(search);
                  }}
                  placeholder=""
                  aria-label="Search for a business"
                />
                <button
                  className="search-btn"
                  onClick={() => handleSearch(search)}
                  aria-label="Search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="20"
                    height="20"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Suggestions */}
            <div className="suggestions-wrap">
              {loading ? (
                <span className="suggestions-loading">
                  <span className="spinner" /> Loading suggestions...
                </span>
              ) : error ? (
                <span className="suggestions-error">{error}</span>
              ) : searchSuggestions.length > 0 ? (
                <>
                  <span className="suggestions-label">
                    <TrendingUp size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    {suggestionType === "popular" ? "Popular" : "Recent"}:
                  </span>

                  {/* Mobile: 3 suggestions */}
                  <div className="suggestions-mobile">
                    {mobileSuggestions.map((b) => (
                      <button
                        key={b.id}
                        className="suggestion-chip"
                        onClick={() => handleSearch(b.name)}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>

                  {/* Desktop: 5 suggestions */}
                  <div className="suggestions-desktop">
                    {desktopSuggestions.map((b) => (
                      <button
                        key={b.id}
                        className="suggestion-chip"
                        onClick={() => handleSearch(b.name)}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        .hero-section {
          width: 100%;
          overflow: hidden;
          position: relative;
          min-height: 500px;
          
        }

        /* Background photo — covers right ~60% of the section */
        .hero-bg-image {
          position: absolute;
          inset: 0;
          background-image: url('/images/Black business man with phone.png');
          background-repeat: no-repeat;
          background-position: right center;
          background-size: auto 100%;
          z-index: 0;
        }

        /* Gradient: solid green on left, fades to transparent ~55% across */
        .hero-bg-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            #1a6e3c 0%,
            #1a6e3c 50%,
            rgba(26, 110, 60, 0.85) 60%,
            rgba(26, 110, 60, 0.3) 68%,
            transparent 80%
          );
          z-index: 1;
        }

        .hero-inner {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
          padding: 64px 48px 64px 48px;
        }

        .hero-content {
          max-width: 520px;
        }

        .hero-heading {
          font-size: clamp(2rem, 3.5vw, 2.75rem);
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
          margin: 0 0 14px 0;
          letter-spacing: -0.02em;
        }

        .hero-brand {
          color: #6ee59c;
        }

        .hero-sub {
          font-size: 1.05rem;
          color: rgba(255,255,255,0.82);
          margin: 0 0 28px 0;
          line-height: 1.6;
        }

        /* Search card */
        .search-card {
          background: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          max-width: 500px;
          box-shadow: 0 4px 28px rgba(0,0,0,0.22);
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          position: relative;
          padding: 4px 4px 4px 0;
        }

        /* Fake placeholder layered over real input */
        .search-placeholder {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.97rem;
          color: #888;
          pointer-events: none;
          white-space: nowrap;
          overflow: hidden;
          max-width: calc(100% - 60px);
        }

        .search-placeholder strong {
          color: #333;
          font-weight: 700;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.97rem;
          color: #1a1a1a;
          padding: 16px 10px 16px 16px;
          background: transparent;
          min-width: 0;
          position: relative;
          z-index: 1;
        }

        .search-btn {
          flex-shrink: 0;
          background: none;
          border: none;
          padding: 10px 16px;
          cursor: pointer;
          color: #1a6e3c;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
          z-index: 1;
        }

        .search-btn:hover {
          color: #0f4a28;
        }

        /* Suggestions */
        .suggestions-wrap {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
        }

        .suggestions-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          white-space: nowrap;
        }

        .suggestions-mobile {
          display: none;
          flex-wrap: wrap;
          gap: 8px;
        }

        .suggestions-desktop {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .suggestion-chip {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.3);
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 500;
          padding: 5px 13px;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
          white-space: nowrap;
        }

        .suggestion-chip:hover {
          background: rgba(255,255,255,0.22);
          border-color: rgba(255,255,255,0.5);
        }

        .suggestions-loading {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.6);
          font-size: 0.82rem;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #6ee59c;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .suggestions-error {
          color: rgba(255,200,200,0.85);
          font-size: 0.8rem;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          /* On mobile the image sits behind full-width content, gradient covers most of it */
          .hero-bg-image {
            background-position: center center;
            background-size: cover;
          }

          .hero-bg-gradient {
            background: linear-gradient(
              to bottom,
              rgba(26, 110, 60, 0.92) 0%,
              rgba(26, 110, 60, 0.88) 60%,
              rgba(26, 110, 60, 0.75) 100%
            );
          }

          .hero-inner {
            padding: 48px 24px 48px 24px;
          }

          .hero-content {
            max-width: 100%;
          }

          .search-card {
            max-width: 100%;
          }

          .suggestions-mobile {
            display: flex;
          }

          .suggestions-desktop {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .hero-heading {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </section>
  );
}