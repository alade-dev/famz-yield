import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "Dual-Asset BTC Yield Vault",
    icon: "🪙",
    gradient: "linear-gradient(135deg, #F7931A 0%, #FF6B35 100%)",
    description: (
      <>
        Combine <strong>wBTC</strong> and <strong>stCORE</strong> in a single
        vault to earn BTC-pegged yield as <strong>lstBTC</strong>. Powered by a
        sophisticated epoch system for fair and transparent distribution.
      </>
    ),
    features: [
      "Multi-asset deposits",
      "BTC-pegged rewards",
      "Epoch-based distribution",
    ],
  },
  {
    title: "Custodian-Secured & Transparent",
    icon: "🔒",
    gradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    description: (
      <>
        All deposits are secured by our <strong>Custodian contract</strong> —
        fully open-source, on-chain, and audited. Complete transparency with
        minimal risk and maximum security.
      </>
    ),
    features: [
      "Open-source contracts",
      "On-chain transparency",
      "Audited security",
    ],
  },
  {
    title: "Flexible Yield Generation",
    icon: "⚡",
    gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    description: (
      <>
        Earn yield on your BTC and LSTs with no fixed lock-up period. Redeem{" "}
        <strong>lstBTC</strong> anytime for your underlying{" "}
        <strong>wBTC</strong> and <strong>stCORE</strong> assets.
      </>
    ),
    features: ["No lock-up period", "Instant redemption", "Flexible deposits"],
  },
  {
    title: "Real-Time Price Oracles",
    icon: "📊",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    description: (
      <>
        Powered by real-time price oracles that update every 15 seconds,
        ensuring accurate valuations and fair yield calculations across all
        market conditions.
      </>
    ),
    features: ["15-second updates", "Accurate pricing", "Market-responsive"],
  },
  {
    title: "Advanced Smart Contracts",
    icon: "🧠",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    description: (
      <>
        Built with cutting-edge Solidity contracts featuring comprehensive
        testing, gas optimization, and security best practices for
        institutional-grade DeFi operations.
      </>
    ),
    features: ["Gas optimized", "Comprehensive testing", "Security audited"],
  },
  {
    title: "Cross-Chain Ready",
    icon: "🌐",
    gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    description: (
      <>
        Designed for the CORE blockchain with architecture that supports future
        cross-chain expansion, enabling broader access to Bitcoin yield
        opportunities.
      </>
    ),
    features: ["CORE native", "Cross-chain ready", "Scalable architecture"],
  },
];

function Feature({ title, icon, gradient, description, features }) {
  return (
    <div className={clsx("col col--4", styles.featureCol)}>
      <div className={styles.featureCard}>
        {/* <div className={styles.featureIcon} style={{ background: gradient }}>
          <span className={styles.iconEmoji}>{icon}</span>
        </div> */}

        <div className={styles.featureContent}>
          <Heading as="h3" className={styles.featureTitle}>
            {title}
          </Heading>
          <p className={styles.featureDescription}>{description}</p>

          <div className={styles.featureList}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                <span className={styles.featureCheck}>✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className={styles.featureGlow}
          style={{ background: gradient }}
        ></div>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featuresHeader}>
          <h2 className={styles.featuresTitle}>Why Choose Famz Yield?</h2>
          <p className={styles.featuresDescription}>
            Built with institutional-grade security and cutting-edge technology
            to maximize your Bitcoin yield potential
          </p>
        </div>

        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
