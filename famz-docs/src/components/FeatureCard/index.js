import React from "react";
import styles from "./styles.module.css";

const FeatureCard = ({
  title,
  description,
  icon,
  gradient,
  features = [],
  link,
  linkText = "Learn More",
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.iconContainer} style={{ background: gradient }}>
        <span className={styles.icon}>{icon}</span>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>

        {features.length > 0 && (
          <ul className={styles.featureList}>
            {features.map((feature, index) => (
              <li key={index} className={styles.featureItem}>
                <span className={styles.checkmark}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        )}

        {link && (
          <a href={link} className={styles.link}>
            {linkText} →
          </a>
        )}
      </div>

      <div className={styles.glow} style={{ background: gradient }}></div>
    </div>
  );
};

export default FeatureCard;
