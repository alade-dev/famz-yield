/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // Main documentation sidebar
  docs: [
    // Overview Section
    {
      type: "category",
      label: "🌟 Overview",
      collapsed: false,
      items: ["overview/vision", "overview/problems", "overview/goals"],
    },

    // Architecture Section
    {
      type: "category",
      label: "🏗️ Architecture",
      collapsed: false,
      items: [
        "architecture/system-design",
        "architecture/contracts",
        "architecture/tokenomics",
      ],
    },

    // User Guide Section
    {
      type: "category",
      label: "👤 User Guide",
      collapsed: false,
      items: [
        "user-guide/depositing",
        "user-guide/yield",
        "user-guide/redeeming",
      ],
    },

    // Developer Guide Section
    {
      type: "category",
      label: "🛠️ Developer Guide",
      collapsed: false,
      items: [
        "developer-guide/setup",
        "developer-guide/testing",
        "developer-guide/contributing",
      ],
    },

    // Economics Section
    {
      type: "category",
      label: "💰 Economics",
      collapsed: true,
      items: ["economics/yield-model"],
    },

    // Security Section
    {
      type: "category",
      label: "🔒 Security",
      collapsed: true,
      items: ["security/audit-status", "security/risk"],
    },

    // Roadmap Section
    {
      type: "category",
      label: "🗺️ Roadmap",
      collapsed: true,
      items: ["roadmap/roadmap"],
    },

    // FAQ Section
    {
      type: "category",
      label: "❓ FAQ",
      collapsed: true,
      items: ["faq/faq"],
    },
  ],

  // Additional sidebars can be defined here
  // For example, if you want separate sidebars for different audiences:

  // developerSidebar: [
  //   {
  //     type: 'category',
  //     label: 'Quick Start',
  //     items: ['developer-guide/setup', 'developer-guide/testing'],
  //   },
  //   // ... more developer-specific content
  // ],

  // userSidebar: [
  //   {
  //     type: 'category',
  //     label: 'Getting Started',
  //     items: ['user-guide/depositing', 'user-guide/yield'],
  //   },
  //   // ... more user-specific content
  // ],
};

module.exports = sidebars;
