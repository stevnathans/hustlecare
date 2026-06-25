/* eslint-disable react/no-unescaped-entities */
import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Hr, Preview, Img,
} from '@react-email/components'

interface WelcomeEmailProps {
  name: string
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Hustlecare — let's build something great</Preview>
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
            <Heading as="h1" style={h1}>Welcome, {name}!</Heading>
            <Text style={text}>
              You've joined thousands of Kenyan entrepreneurs using Hustlecare to identify
              business requirements, calculate startup costs, and get step-by-step guides
              to launch with confidence.
            </Text>
            <Text style={text}>Here's what you can do right now:</Text>
            <Text style={listItem}>📋 Browse 50+ business ideas with real startup costs</Text>
            <Text style={listItem}>🧮 Calculate exactly what you need to get started</Text>
            <Text style={listItem}>📖 Follow step-by-step startup guides</Text>

            <Section style={{ textAlign: 'center' as const, margin: '28px 0 8px' }}>
              <Button href="https://hustlecare.net/businesses" style={button}>
                Explore Business Ideas
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Hustlecare · Nairobi, Kenya</Text>
            <Text style={footerText}>
              You're receiving this because you created an account at{' '}
              <a href="https://hustlecare.net" style={{ color: '#059669' }}>hustlecare.net</a>
            </Text>
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
const listItem: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0 0 8px',
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