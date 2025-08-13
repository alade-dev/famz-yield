import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx(styles.heroBanner)}>
      <div className={styles.heroBackground}>
        <div className={styles.gradientOverlay}></div>
        <div className={styles.particleEffect}></div>
      </div>

      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.logoContainer}>
            <img
              src="/img/logo5.png"
              alt="Famz Yield"
              className={styles.heroLogo}
            />
          </div>

          <h1 className={styles.heroTitle}>
            Famz Yield
            <span className={styles.heroSubtitle}>Documentation</span>
          </h1>

          <p className={styles.heroDescription}>
            The complete guide to building and integrating with Famz Yield - a
            professional decentralized BTC yield vault on the CORE Blockchain
          </p>

          {/* Warning Banner */}
          <div className={styles.warningBanner}>
            <div className={styles.warningIcon}>⚠️</div>
            <div className={styles.warningContent}>
              <strong>Testnet Environment</strong>
              <span>
                This documentation covers testnet deployment. Do not use real
                funds.
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className={styles.heroButtons}>
            <Link
              className={clsx("button", styles.primaryButton)}
              to="/overview/vision"
            >
              <span className={styles.buttonIcon}>🚀</span>
              Get Started
            </Link>
            <Link
              className={clsx("button", styles.secondaryButton)}
              to="/developer-guide/setup"
            >
              <span className={styles.buttonIcon}>⚡</span>
              Quick Setup
            </Link>
          </div>

          {/* Stats */}
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>15+</div>
              <div className={styles.statLabel}>Smart Contracts</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>100%</div>
              <div className={styles.statLabel}>Open Source</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>24/7</div>
              <div className={styles.statLabel}>Yield Generation</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function QuickStartSection() {
  const quickStartItems = [
    {
      icon: "📖",
      title: "Read the Overview",
      description: "Understand the Famz Yield architecture and vision",
      link: "/overview/vision",
      color: "#4F46E5",
    },
    {
      icon: "🛠️",
      title: "Developer Setup",
      description: "Set up your development environment in minutes",
      link: "/developer-guide/setup",
      color: "#059669",
    },
    {
      icon: "🔐",
      title: "Security & Audits",
      description: "Learn about our security measures and audit status",
      link: "/security/audit-status",
      color: "#DC2626",
    },
    {
      icon: "💰",
      title: "Tokenomics",
      description: "Explore the economic model and yield mechanisms",
      link: "/economics/yield-model",
      color: "#7C2D12",
    },
  ];

  return (
    <section className={styles.quickStartSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Quick Start Guide</h2>
          <p className={styles.sectionDescription}>
            Everything you need to get started with Famz Yield
          </p>
        </div>

        <div className={styles.quickStartGrid}>
          {quickStartItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className={styles.quickStartCard}
              style={{ "--accent-color": item.color }}
            >
              <div className={styles.cardIcon}>{item.icon}</div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
              <div className={styles.cardArrow}>→</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStackSection() {
  const techStack = [
    {
      name: "Solidity",
      logo: "/img/solidiity.png",
      description: "Smart Contracts",
    },
    {
      name: "React",
      logo: "/img/react.png",
      description: "Frontend Framework",
    },
    {
      name: "Wagmi",
      logo: "/img/ethereum.png",
      description: "Web3 Integration",
    },
    {
      name: "CORE Chain",
      logo: "/img/core.png",
      description: "Blockchain Network",
    },
    {
      name: "Hardhat",
      logo: "/img/hardhat.png",
      description: "Development Environment",
    },
    {
      name: "Viem",
      logo: "/img/ethereum.png",
      description: "Ethereum Library",
    },
  ];

  return (
    <section className={styles.techStackSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Built With Modern Tech</h2>
          <p className={styles.sectionDescription}>
            Famz Yield leverages cutting-edge blockchain and web technologies
            for professional-grade DeFi operations
          </p>
        </div>

        <div className={styles.techGrid}>
          {techStack.map((tech, index) => (
            <div key={index} className={styles.techCard}>
              <div className={styles.techLogo}>
                <img
                  src={tech.logo}
                  alt={tech.name}
                  className={styles.techImage}
                />
              </div>
              <h4 className={styles.techName}>{tech.name}</h4>
              <p className={styles.techDescription}>{tech.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Famz Yield Documentation"
      description="Complete documentation for Famz Yield - A decentralized BTC yield vault on CORE Blockchain"
    >
      <HomepageHeader />
      <main>
        <QuickStartSection />
        <HomepageFeatures />
        <TechStackSection />
      </main>
    </Layout>
  );
}
