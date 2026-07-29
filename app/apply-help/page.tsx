// app/apply-help/page.tsx
import { Metadata } from 'next';
import ApplyHelpForm from '@/components/apply-help/ApplyHelpForm';

export const metadata: Metadata = {
  title: 'Get Help Applying for a Legal Requirement | HustleCare',
  description: 'Request hands-on help applying for a business permit, licence, or certificate in your county.',
};

export default function ApplyHelpPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Need Help Applying?
        </h1>
        <p className="text-slate-600 leading-relaxed">
          Tell us what you need and where — our team will reach out to help you complete the application.
        </p>
      </div>
      <ApplyHelpForm />
    </div>
  );
}