// src/components/HomepageFeatures.js
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

// Use inline SVGs for full control (no external dependencies)
const FeatureList = [
  {
    title: "BTC + LST Yield Vault",
    Svg: () => (
      <svg
        viewBox="0 0 24 24"
        width="80"
        height="80"
        className={styles.featureSvg}
      >
        <circle cx="12" cy="12" r="10" fill="#F7931A" /> {/* Bitcoin Orange */}
        <path
          d="M12 6v12M6 12h12"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    ),
    description: (
      <>
        Deposit <strong>wBTC and stCORE</strong> into a single vault and earn
        yield as <strong>lstBTC</strong> — a token pegged 1:1 to Bitcoin value.
      </>
    ),
  },
  {
    title: "Custodian-Secured Assets",
    Svg: () => (
      <svg
        viewBox="0 0 24 24"
        width="80"
        height="80"
        className={styles.featureSvg}
      >
        <rect
          x="4"
          y="6"
          width="16"
          height="12"
          rx="2"
          fill="#6366F1"
          stroke="white"
          strokeWidth="2"
        />
        <line
          x1="12"
          y1="6"
          x2="12"
          y2="18"
          stroke="white"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle cx="12" cy="9" r="1.5" fill="white" />
        <circle cx="12" cy="15" r="1.5" fill="white" />
      </svg>
    ),
    description: (
      <>
        All deposits are held securely by the{" "}
        <strong>Custodian contract</strong>, ensuring transparency and reducing
        smart contract risk.
      </>
    ),
  },
  {
    title: "Yield Without Locking",
    Svg: () => (
      <svg
        viewBox="0 0 24 24"
        width="80"
        height="80"
        className={styles.featureSvg}
      >
        <path
          d="M12 2L2 7v10l10 5 10-5V7l-10-5z"
          fill="#10B981"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M12 8v8M8 10h8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="14" r="1" fill="white" />
      </svg>
    ),
    description: (
      <>
        Earn yield on your assets while maintaining full liquidity. Redeem{" "}
        <strong>lstBTC anytime</strong> for your original wBTC and stCORE.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
