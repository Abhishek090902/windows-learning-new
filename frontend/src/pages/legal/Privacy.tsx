import { Database, Eye, Lock } from 'lucide-react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

const sections = [
  {
    number: '01',
    title: 'Information We Collect',
    body: 'We collect personal information you provide such as name, email, and phone number, along with usage data like browsing behavior, session history, and device information. For mentors, we also collect identity verification documents.',
  },
  {
    number: '02',
    title: 'How We Use Your Information',
    body: 'We use your information to operate the platform, improve the product experience, process payments, verify mentor identities, send updates, and maintain platform safety.',
  },
  {
    number: '03',
    title: 'Data Security',
    body: 'We use encryption for sensitive data, PCI-compliant payment handling, access controls, and periodic security reviews. Even with these safeguards, no online transmission can be guaranteed to be fully risk free.',
  },
  {
    number: '04',
    title: 'Data Sharing',
    body: 'We do not sell your personal data. We may share limited information with infrastructure, payment, video, and verification providers, or with authorities when legally required.',
  },
  {
    number: '05',
    title: 'Cookies',
    body: 'Essential cookies support account access and core site functionality. Analytics cookies help us understand product performance and improve usability over time.',
  },
  {
    number: '06',
    title: 'Your Rights',
    body: 'You may request access, correction, deletion, portability, or reduced processing of your personal information, subject to legal and operational requirements.',
  },
  {
    number: '07',
    title: 'Data Retention',
    body: 'We keep data for as long as needed to operate your account and meet legal, compliance, audit, and dispute resolution obligations. Some information may be retained for a limited time after account deletion.',
  },
  {
    number: '08',
    title: 'Contact',
    body: 'For privacy-related concerns, contact our Data Protection Officer at privacy@windowslearning.com.',
  },
];

const Privacy = () => {
  return (
    <LegalPageLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      description="This page explains what information Windows Learning collects, why it is used, how it is protected, and what control users have over their personal data."
      updatedAt="March 1, 2026"
      asideTitle="Privacy at a glance"
      asideCopy="We collect the information needed to run mentoring, payments, verification, and support workflows, and we aim to limit access, protect sensitive records, and be clear about where data is used."
      accent="radial-gradient(circle at center, rgba(59,130,246,0.24), rgba(255,255,255,0))"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <Database className="h-5 w-5 text-sky-600" />
          <h2 className="mt-4 text-base font-semibold text-slate-900">Collected with purpose</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">The policy focuses on the data required to support onboarding, sessions, payments, communication, and safety workflows.</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <Lock className="h-5 w-5 text-emerald-600" />
          <h2 className="mt-4 text-base font-semibold text-slate-900">Protected with controls</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sensitive information is expected to be protected through encryption, provider safeguards, and restricted access patterns.</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <Eye className="h-5 w-5 text-violet-600" />
          <h2 className="mt-4 text-base font-semibold text-slate-900">Visible user rights</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Users should be able to understand what is stored, request changes, and ask questions about how their data is handled.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {sections.map((section) => (
          <section key={section.number} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                {section.number}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[15px]">{section.body}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </LegalPageLayout>
  );
};

export default Privacy;
