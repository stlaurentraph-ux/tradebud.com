'use client';

import Image from 'next/image';
import styles from './auth-status-card.module.css';

type AuthStatusCardProps = {
  title: string;
  detail: string;
  footer?: string;
  loading?: boolean;
  error?: boolean;
};

export function AuthStatusCard({ title, detail, footer, loading, error }: AuthStatusCardProps) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Image
          src="/tracebud-logo-v6.png"
          alt="Tracebud"
          width={56}
          height={56}
          className={styles.logo}
        />
        <p className={styles.brand}>Tracebud</p>
        <p className={styles.subtitle}>Field app for farmers</p>
        <h1 className={`${styles.title} ${error ? styles.titleError : ''}`}>
          {loading ? '…' : ''} {title}
        </h1>
        <p className={styles.detail}>{detail}</p>
        {footer ? <p className={styles.footer}>{footer}</p> : null}
        {loading ? <div className={styles.spinner} aria-hidden /> : null}
      </div>
    </div>
  );
}
