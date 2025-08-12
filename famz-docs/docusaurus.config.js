const { themes } = require("prism-react-renderer");

module.exports = {
  title: "Famz Yield",
  tagline: "BTC Yield Vault on CORE Blockchain",
  favicon: "img/logo.svg",

  url: "https://famz-defi.vercel.app/",
  baseUrl: "/",
  organizationName: "github",
  projectName: "famz-docs",

  onBrokenLinks: "throw",
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
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: "Famz Yield",
      logo: {
        alt: "Famz Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/alade-dev/famz-vault",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Overview", to: "/" },
            { label: "Architecture", to: "/architecture/system-design" },
          ],
        },
        {
          title: "Community",
          items: [
            { label: "Discord", href: "https://discord.gg/..." },
            { label: "Twitter", href: "https://x.com/famz_yield" },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/alade-dev/famz-vault",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Famz Team`,
    },
    prism: {
      theme: themes.github,
      darkTheme: themes.dracula,
    },
  },
};
