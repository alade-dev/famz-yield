import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "Dual-Asset BTC Yield Vault",
    Svg: () => (
      <svg
        viewBox="0 0 24 24"
        width="80"
        height="80"
        className={styles.featureSvg}
      >
        <circle cx="12" cy="12" r="10" fill="#F7931A" />
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
        Combine <strong>wBTC</strong> and <strong>stCORE</strong> in a single
        vault to earn BTC-pegged yield as <strong>lstBTC</strong>. Powered by a
        24-hour epoch system for fair distribution.
      </>
    ),
  },
  {
    title: "Custodian-Secured & Transparent",
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
        All deposits are held by the <strong>Custodian contract</strong> —
        open-source, on-chain, and designed to minimize risk while ensuring full
        transparency.
      </>
    ),
  },
  {
    title: "Yield with No Fixed Lock-Up",
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
        Earn yield on your BTC and LSTs with no fixed lock-up period. Redeem{" "}
        <strong>lstBTC</strong> anytime for your underlying{" "}
        <strong>wBTC</strong> and <strong>stCORE</strong>.
      </>
    ),
  },
  {
    title: "Epoch-Based Fair Yield",
    Svg: () => (
      <svg
        viewBox="0 0 24 24"
        width="80"
        height="80"
        className={styles.featureSvg}
      >
        <circle cx="12" cy="12" r="10" fill="#3B82F6" />
        <path
          d="M12 6v6l4 2"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    ),
    description: (
      <>
        Yield is calculated and distributed at the end of each epoch, ensuring
        all participants receive rewards fairly based on their share.
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
