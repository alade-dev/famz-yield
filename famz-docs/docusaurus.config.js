const { themes } = require("prism-react-renderer");

module.exports = {
  title: "Famz Yield",
  tagline: "Professional BTC Yield Vault on CORE Blockchain",
  favicon: "img/logo5.png",

  url: "https://famz-defi.vercel.app/",
  baseUrl: "/",
  organizationName: "famz-yield",
  projectName: "famz-yield-docs",

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.js",
          routeBasePath: "/",
          editUrl:
            "https://github.com/alade-dev/famz-yield/tree/main/famz-docs/",
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        blog: false, // Disable blog
        theme: {
          customCss: "./src/css/custom.css",
        },
        // gtag: {
        //   trackingID: "G-XXXXXXXXXX", // Replace with your Google Analytics ID
        //   anonymizeIP: true,
        // },
      },
    ],
  ],

  themeConfig: {
    // Enhanced metadata
    metadata: [
      {
        name: "description",
        content:
          "Complete documentation for Famz Yield - A professional, decentralized BTC yield vault on CORE Blockchain with real-time oracles and institutional-grade security.",
      },
      {
        name: "keywords",
        content:
          "Bitcoin, BTC, yield, vault, DeFi, CORE blockchain, stCORE, wBTC, lstBTC, documentation",
      },
      {
        property: "og:image",
        content: "img/og-image.png",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],

    // Enhanced navbar
    navbar: {
      title: "Famz Yield",
      logo: {
        alt: "Famz Yield Logo",
        src: "img/logo5.png",
        width: 32,
        height: 32,
      },
      hideOnScroll: false,
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "📚 Documentation",
        },
        {
          to: "/developer-guide/setup",
          position: "left",
          label: "🛠️ Developer Guide",
        },
        {
          to: "/security/audit-status",
          position: "left",
          label: "🔒 Security",
        },
        // Search will be automatically added by Docusaurus
        // {
        //   type: "search",
        //   position: "right",
        // },
        {
          href: "https://github.com/alade-dev/famz-yield",
          label: "GitHub",
          position: "right",
          className: "header-github-link",
        },
        {
          href: "https://famz-defi.vercel.app",
          label: "🚀 Launch App",
          position: "right",
          className: "header-launch-link",
        },
      ],
    },

    // Enhanced footer
    footer: {
      style: "dark",
      logo: {
        alt: "Famz Yield Logo",
        src: "img/logo5.png",
        width: 40,
        height: 40,
      },
      links: [
        {
          title: "📖 Documentation",
          items: [
            { label: "Overview", to: "/overview/vision" },
            { label: "Architecture", to: "/architecture/system-design" },
            { label: "User Guide", to: "/user-guide/depositing" },
            { label: "Developer Guide", to: "/developer-guide/setup" },
          ],
        },
        {
          title: "🔧 Resources",
          items: [
            { label: "Smart Contracts", to: "/architecture/contracts" },
            { label: "Security Audits", to: "/security/audit-status" },
            { label: "Tokenomics", to: "/architecture/tokenomics" },
            { label: "FAQ", to: "/faq" },
          ],
        },
        {
          title: "🌐 Community",
          items: [
            {
              label: "Discord",
              href: "https://discord.gg/famz-yield",
            },
            {
              label: "Twitter",
              href: "https://x.com/famz_yield",
            },
            {
              label: "Telegram",
              href: "https://t.me/famz_yield",
            },
          ],
        },
        {
          title: "🚀 Links",
          items: [
            {
              label: "Launch App",
              href: "https://famz-defi.vercel.app",
            },
            {
              label: "GitHub",
              href: "https://github.com/alade-dev/famz-yield",
            },
            {
              label: "CORE Blockchain",
              href: "https://coredao.org",
            },
          ],
        },
      ],
      copyright: `
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #334155;">
          <p style="margin: 0 0 0.5rem 0;">Copyright © ${new Date().getFullYear()} Famz Yield Team. Built with ❤️ for the Bitcoin ecosystem.</p>
          <p style="margin: 0; font-size: 0.875rem; color: #94a3b8;">
            ⚠️ <strong>Testnet Only:</strong> This is experimental software. Do not deposit real funds.
          </p>
        </div>
      `,
    },

    // Enhanced code highlighting
    prism: {
      theme: themes.github,
      darkTheme: themes.dracula,
      additionalLanguages: [
        "solidity",
        "javascript",
        "typescript",
        "json",
        "bash",
      ],
    },

    // Enhanced color mode
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    // Table of contents
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 5,
    },

    // Announcement bar
    announcementBar: {
      id: "testnet-warning",
      content:
        '⚠️ <strong>Testnet Environment:</strong> This documentation covers testnet deployment. <a href="/security/risk" style="color: #fbbf24; text-decoration: underline;">Learn about risks</a>',
      backgroundColor: "#7c2d12",
      textColor: "#fef3c7",
      isCloseable: true,
    },

    // Docs sidebar
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },

    // Search configuration (if using Algolia DocSearch)
    // algolia: {
    //   appId: 'YOUR_APP_ID',
    //   apiKey: 'YOUR_SEARCH_API_KEY',
    //   indexName: 'core-yield-hub',
    //   contextualSearch: true,
    //   searchPagePath: 'search',
    // },
  },

  // Remove problematic plugins for now - can be added later if needed
  // plugins: [
  //   [
  //     "@docusaurus/plugin-ideal-image",
  //     {
  //       quality: 70,
  //       max: 1030,
  //       min: 640,
  //       steps: 2,
  //       disableInDev: false,
  //     },
  //   ],
  // ],

  // Custom CSS for additional styling
  stylesheets: [
    "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
  ],

  // PWA configuration (optional)
  // themes: ['@docusaurus/theme-live-codeblock'],
};
