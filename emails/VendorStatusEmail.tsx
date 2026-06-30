import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Hr, Preview, Img,
} from '@react-email/components'

interface VendorStatusEmailProps {
  name: string
  status: 'suspended' | 'reinstated'
  reason?: string
}

export default function VendorStatusEmail({ name, status, reason }: VendorStatusEmailProps) {
  const isSuspended = status === 'suspended'

  return (
    <Html lang="en">
      <Head />
      <Preview>{isSuspended ? 'Your vendor account has been suspended' : 'Your vendor account is active again'}</Preview>
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
            <Heading as="h1" style={h1}>
              {isSuspended ? 'Account suspended' : 'Account reinstated'}
            </Heading>
            <Text style={text}>Hi {name},</Text>
            {isSuspended ? (
              <>
                <Text style={text}>
                  Your Hustlecare vendor account has been suspended
                  {reason ? `: ${reason}` : '.'}
                </Text>
                <Text style={text}>
                  Your products have been removed from the marketplace while this is under review.
                  If you believe this was a mistake, you can submit an appeal from your vendor dashboard.
                </Text>
              </>
            ) : (
              <Text style={text}>
                Good news — your Hustlecare vendor account is active again. Your products have
                been restored to the marketplace and are visible to entrepreneurs once more.
              </Text>
            )}

            <Section style={{ textAlign: 'center' as const, margin: '28px 0 8px' }}>
              <Button href="https://hustlecare.net/vendor/dashboard" style={button}>
                Go to vendor dashboard
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>Hustlecare · hustlecare.net</Text>
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
const h1: React.CSSProperties = { color: '#111827', fontSize: '22px', fontWeight: '700', margin: '0 0 16px', letterSpacing: '-0.02em' }
const text: React.CSSProperties = { color: '#4b5563', fontSize: '15px', lineHeight: '1.7', margin: '0 0 12px' }
const button: React.CSSProperties = { backgroundColor: '#059669', color: '#ffffff', padding: '14px 32px', borderRadius: '9px', fontWeight: '600', fontSize: '15px', textDecoration: 'none', display: 'inline-block' }
const hr: React.CSSProperties = { borderColor: '#e5e7eb', margin: '0' }
const footer: React.CSSProperties = { padding: '20px 40px', textAlign: 'center' }
const footerText: React.CSSProperties = { color: '#9ca3af', fontSize: '12px', margin: '0 0 4px', lineHeight: '1.6' }