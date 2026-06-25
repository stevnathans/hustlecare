/* eslint-disable react/no-unescaped-entities */
import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Hr, Preview, Img,
} from '@react-email/components'

interface PasswordResetEmailProps {
  name: string
  resetUrl: string
}

export default function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your Hustlecare password — link expires in 1 hour</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Img
              src="https://hustlecare.net/icons/logo.svg"
              alt="Hustlecare"
              width="140"
              style={{ margin: '0 auto', display: 'block' }}
            />
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h1" style={h1}>Password reset</Heading>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              We received a request to reset your Hustlecare password. Click the button
              below to choose a new one. This link expires in{' '}
              <strong style={{ color: '#111827' }}>1 hour</strong>.
            </Text>

            <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
              <Button href={resetUrl} style={button}>
                Reset my password
              </Button>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                🔒 If you didn't request this, you can safely ignore this email.
                Your password won't change.
              </Text>
            </Section>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Hustlecare · hustlecare.net</Text>
            <Text style={footerText}>For your security, this link expires in 1 hour.</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#f6f9f8',
  fontFamily: "'Sora', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: '32px 0',
}
const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
}
const header: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  padding: '28px 40px',
  textAlign: 'center',
  borderBottom: '1px solid #d1fae5',
}
const content: React.CSSProperties = {
  padding: '32px 40px',
}
const h1: React.CSSProperties = {
  color: '#111827',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0 0 16px',
  letterSpacing: '-0.02em',
}
const text: React.CSSProperties = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 12px',
}
const button: React.CSSProperties = {
  backgroundColor: '#059669',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '9px',
  fontWeight: '600',
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block',
}
const warningBox: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  borderRadius: '9px',
  padding: '12px 16px',
  borderLeft: '3px solid #f59e0b',
  margin: '0',
}
const warningText: React.CSSProperties = {
  color: '#92400e',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
}
const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '0',
}
const footer: React.CSSProperties = {
  padding: '20px 40px',
  textAlign: 'center',
}
const footerText: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 0 4px',
  lineHeight: '1.6',
}