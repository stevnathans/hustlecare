import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Hr, Preview, Img,
} from '@react-email/components'

interface NotificationEmailProps {
  name: string
  title: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
  unsubscribeUrl?: string
}

export default function NotificationEmail({
  name,
  title,
  message,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl, // was missing here — that's the error
}: NotificationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{title}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Section style={header}>
            <Img
              src="https://hustlecare.net/icons/logo.svg"
              alt="Hustlecare"
              width="140"
              style={{ margin: '0 auto', display: 'block' }}
            />
          </Section>

          <Section style={content}>
            <Heading as="h1" style={h1}>{title}</Heading>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>{message}</Text>
            {ctaLabel && ctaUrl && (
              <Section style={{ textAlign: 'center' as const, margin: '28px 0 8px' }}>
                <Button href={ctaUrl} style={button}>{ctaLabel}</Button>
              </Section>
            )}
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>Hustlecare · hustlecare.net</Text>
            <Text style={footerText}>
              <a
                href={unsubscribeUrl ?? 'https://hustlecare.net/unsubscribe'}
                style={{ color: '#9ca3af' }}
              >
                Unsubscribe from marketing emails
              </a>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = { backgroundColor: '#f6f9f8', fontFamily: "'Sora', Helvetica, Arial, sans-serif", margin: 0, padding: '32px 0' }
const container: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb' }
const header: React.CSSProperties = { backgroundColor: '#f0fdf4', padding: '28px 40px', textAlign: 'center', borderBottom: '1px solid #d1fae5' }
const content: React.CSSProperties = { padding: '32px 40px' }
const h1: React.CSSProperties = { color: '#111827', fontSize: '20px', fontWeight: '700', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text: React.CSSProperties = { color: '#4b5563', fontSize: '15px', lineHeight: '1.7', margin: '0 0 12px' }
const button: React.CSSProperties = { backgroundColor: '#059669', color: '#ffffff', padding: '14px 32px', borderRadius: '9px', fontWeight: '600', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }
const hr: React.CSSProperties = { borderColor: '#e5e7eb', margin: '0' }
const footer: React.CSSProperties = { padding: '20px 40px', textAlign: 'center' }
const footerText: React.CSSProperties = { color: '#9ca3af', fontSize: '12px', margin: '0 0 4px', lineHeight: '1.6' }