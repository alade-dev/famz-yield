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
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>

        {/* Warning Banner */}
        <div className={styles.warning}>
          ⚠️ <strong>WARNING</strong>: This is a <strong>testnet</strong>{" "}
          project. Do not deposit real funds.
        </div>

        {/* Get Started Button */}
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/overview/vision"
          >
            📚 Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Welcome to Famz Yield"
      description="A decentralized vault on CORE Blockchain for wBTC and stCORE"
    >
      <HomepageHeader />

      <main className="container margin-top--lg margin-bottom--lg">
        <h2>Quick Start</h2>
        <ul>
          <li>
            📚 <Link to="/overview/vision">Read the Overview</Link>
          </li>
          <li>
            🔧 <Link to="/developer-guide/setup">Set Up for Development</Link>
          </li>
          <li>
            💬 <Link to="https://discord.gg/...">Join Discord</Link>
          </li>
        </ul>
      </main>

      <HomepageFeatures />
    </Layout>
  );
}
