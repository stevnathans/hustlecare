// app/services/[service]/questionnaire/layout.tsx
//
// The wizard is meant to feel full-screen and distraction-free (Stripe
// onboarding / Typeform style), so this layout intentionally does NOT
// render your global site header/footer. If your root layout renders
// them unconditionally (rather than via a nested layout you can opt out
// of), you'll want to move header/footer rendering into
// app/(marketing)/layout.tsx or similar and leave this route outside
// that group. Flag if you want help restructuring the route groups.

export default function QuestionnaireLayout({ children }: { children: React.ReactNode }) {
  return <div className="font-sans antialiased">{children}</div>;
}