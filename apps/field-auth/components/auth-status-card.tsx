'use client';

import Image from 'next/image';

type AuthStatusCardProps = {
  title: string;
  detail: string;
  footer?: string;
  loading?: boolean;
  error?: boolean;
};

export function AuthStatusCard({ title, detail, footer, loading, error }: AuthStatusCardProps) {
  return (
    <div className="page">
      <div className="card">
        <Image
          src="/tracebud-logo-v6.png"
          alt="Tracebud"
          width={56}
          height={56}
          className="logo"
        />
        <p className="brand">Tracebud</p>
        <p className="subtitle">Field app for farmers</p>
        <h1 className={`title ${error ? 'title-error' : ''}`}>
          {loading ? '…' : ''} {title}
        </h1>
        <p className="detail">{detail}</p>
        {footer ? <p className="footer">{footer}</p> : null}
        {loading ? <div className="spinner" aria-hidden /> : null}
      </div>
      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }
        .card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border: 1px solid #d1fae5;
          border-radius: 12px;
          padding: 32px 28px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(6, 78, 59, 0.06);
        }
        .logo {
          border-radius: 12px;
          margin: 0 auto 12px;
        }
        .brand {
          margin: 0;
          font-weight: 700;
          font-size: 1.25rem;
          color: #064e3b;
        }
        .subtitle {
          margin: 4px 0 20px;
          font-size: 0.875rem;
          color: #6b7280;
        }
        .title {
          margin: 0 0 12px;
          font-size: 1.125rem;
          font-weight: 600;
          color: #022c22;
        }
        .title-error {
          color: #b91c1c;
        }
        .detail {
          margin: 0;
          font-size: 0.9375rem;
          line-height: 1.55;
          color: #374151;
        }
        .footer {
          margin: 20px 0 0;
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.5;
        }
        .spinner {
          width: 28px;
          height: 28px;
          margin: 20px auto 0;
          border: 3px solid #d1fae5;
          border-top-color: #16a34a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
