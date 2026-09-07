/** @type {import('next').NextConfig} */
const nextConfig = {
  // App router is the default in Next.js 14 - no extra config needed
  // Images from /public are served at root path automatically
  output: "export",

  images: {
    // Static export on Hostinger has no image optimization server,
    // so we ship the original images directly.
    unoptimized: true,
  },

  // Make sure CSS Modules work (they do by default in Next.js)
  // Make @/* path alias work (configured in jsconfig.json)
};

module.exports = nextConfig;
