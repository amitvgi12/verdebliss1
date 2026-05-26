'use strict'

// Local defaults — overridden in CI via --collect.url flags pointing at the
// Vercel preview URL. Run locally with: npm start && npm run lhci
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/products',
        'http://localhost:3000/products/bakuchiol-renewal-serum',
        'http://localhost:3000/account',
        'http://localhost:3000/quiz',
      ],
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
        throttlingMethod: 'simulate',
        throttling: {
          // Simulated fast 4G / mid-tier mobile — matches P75 CrUX conditions
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        // ── Core Web Vitals (2026 thresholds) ─────────────────────────────
        // LCP ≤ 2500ms → fail CI
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        // CLS ≤ 0.1 → error
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // TBT is the lab proxy for INP (no lab INP metric exists).
        // INP ≤ 200ms real-user maps roughly to TBT ≤ 300ms in simulation.
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        // ── Supporting metrics ─────────────────────────────────────────────
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        'interactive': ['warn', { maxNumericValue: 3800 }],
        // ── Category scores ────────────────────────────────────────────────
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      // Free ephemeral storage — reports expire after 30 days.
      // Replace with lhci server or Lighthouse CI GitHub App for persistent history.
      target: 'temporary-public-storage',
    },
  },
}
