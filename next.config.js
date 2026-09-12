// Applied to every route. Firebase's signInWithPopup needs the opener link,
// so COOP stays at same-origin-allow-popups rather than same-origin.
const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

// Only public share pages may be embedded in other sites.
const noFramingHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/share/:path*", headers: baseSecurityHeaders },
      {
        source: "/:path((?!share/).*)",
        headers: [...baseSecurityHeaders, ...noFramingHeaders],
      },
    ];
  },
};

module.exports = nextConfig;
