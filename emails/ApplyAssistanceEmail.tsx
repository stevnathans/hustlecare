// emails/ApplyAssistanceEmail.tsx
//
// One plain, readable layout for every "Apply For Me" email. Built with
// ordinary JSX and inline styles (no extra email library needed).

import * as React from 'react';

export interface ApplyAssistanceEmailProps {
  heading: string;
  paragraphs: string[];
  bulletsTitle?: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
  /** Reminder emails only: a one-click link to stop further reminders. */
  unsubscribeUrl?: string;
}

const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export default function ApplyAssistanceEmail({
  heading,
  paragraphs,
  bulletsTitle,
  bullets,
  ctaLabel,
  ctaUrl,
  footnote,
  unsubscribeUrl,
}: ApplyAssistanceEmailProps) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f1f5f9', fontFamily: font }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f1f5f9' }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '32px 16px' }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ maxWidth: 520, backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: '28px 28px 8px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>Hustlecare</div>
                        <h1 style={{ fontSize: 22, lineHeight: '30px', color: '#0f172a', margin: '12px 0 0' }}>{heading}</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 28px 0' }}>
                        {paragraphs.map((p, i) => (
                          <p key={i} style={{ fontSize: 15, lineHeight: '24px', color: '#334155', margin: '12px 0' }}>
                            {p}
                          </p>
                        ))}
                        {bullets && bullets.length > 0 && (
                          <div style={{ margin: '12px 0' }}>
                            {bulletsTitle && (
                              <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>{bulletsTitle}</p>
                            )}
                            <ul style={{ margin: 0, paddingLeft: 20, color: '#334155', fontSize: 15, lineHeight: '24px' }}>
                              {bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                    {ctaLabel && ctaUrl && (
                      <tr>
                        <td style={{ padding: '12px 28px 8px' }}>
                          <a
                            href={ctaUrl}
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              textDecoration: 'none',
                              fontSize: 15,
                              fontWeight: 600,
                              padding: '12px 22px',
                              borderRadius: 10,
                            }}
                          >
                            {ctaLabel}
                          </a>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: '16px 28px 28px' }}>
                        {footnote && (
                          <p style={{ fontSize: 13, lineHeight: '20px', color: '#64748b', margin: '0 0 8px' }}>{footnote}</p>
                        )}
                        <p style={{ fontSize: 13, lineHeight: '20px', color: '#64748b', margin: 0 }}>
                          Questions? Reply to this email and a real person will answer.
                        </p>
                        {unsubscribeUrl && (
                          <p style={{ fontSize: 12, lineHeight: '18px', color: '#94a3b8', margin: '10px 0 0' }}>
                            Not interested?{' '}
                            <a href={unsubscribeUrl} style={{ color: '#94a3b8' }}>
                              Stop these reminders
                            </a>
                            .
                          </p>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}