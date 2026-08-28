/** @type {import('next').NextConfig} */
const nextConfig = {
  // App router is the default in Next.js 14 — no extra config needed
  // Images from /public are served at root path automatically
  images: {
    // All images are local (in /public). No remote domains needed.
    // Uncomment and add if you ever use external CDN:
    // domains: [],
  },

  // Make sure CSS Modules work (they do by default in Next.js)
  // Make @/* path alias work (configured in jsconfig.json)
};

module.exports = nextConfig;
