import { FileCheck, Scale, Shield } from 'lucide-react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

const sections = [
  {
    number: '01',
    title: 'Acceptance of Terms',
    body: 'By accessing or using Windows Learning ("Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.',
  },
  {
    number: '02',
    title: 'Description of Service',
    body: 'Windows Learning provides an online marketplace connecting learners with verified mentors for live, interactive mentorship sessions. We facilitate the connection but are not a party to the mentoring agreement between mentors and learners.',
  },
  {
    number: '03',
    title: 'User Accounts',
    body: 'You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.',
  },
  {
    number: '04',
    title: 'Mentor Verification',
    body: 'All mentors undergo identity verification (Aadhaar/Government ID). While we verify identities, we do not guarantee the quality of mentoring services. Ratings and reviews from learners serve as quality indicators.',
  },
  {
    number: '05',
    title: 'Payments and Refunds',
    body: 'Payments are processed through Razorpay. Session fees are set by individual mentors. The platform retains a 20% commission. Refunds are available for cancelled sessions as per our refund policy.',
  },
  {
    number: '06',
    title: 'Session Conduct',
    body: 'Users must conduct themselves professionally during sessions. Any form of harassment, discrimination, or inappropriate behavior will result in immediate account suspension.',
  },
  {
    number: '07',
    title: 'Intellectual Property',
    body: 'All content on the Platform, including text, graphics, logos, and software, is the property of Windows Learning or its content suppliers. Users retain ownership of content they create during sessions.',
  },
  {
    number: '08',
    title: 'Limitation of Liability',
    body: 'Windows Learning shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Platform. Our total liability shall not exceed the amount paid by you in the last 12 months.',
  },
  {
    number: '09',
    title: 'Contact',
    body: 'For questions about these Terms, contact us at legal@windowslearning.com.',
  },
];

const Terms = () => {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Terms of Service"
      description="These terms explain how Windows Learning operates, what users can expect from the platform, and the standards required to keep mentoring sessions safe and professional."
      updatedAt="March 1, 2026"
      asideTitle="Simple summary"
      asideCopy="Use the platform responsibly, keep account information accurate, respect other users during sessions, and understand that payments, refunds, and platform liability follow the rules outlined below."
      accent="radial-gradient(circle at center, rgba(16,185,129,0.24), rgba(255,255,255,0))"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <FileCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="mt-4 text-base font-semibold text-slate-900">Clear usage rules</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Expectations are written in plain language so learners and mentors know how the platform should be used.</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <Scale className="h-5 w-5 text-sky-600" />
          <h2 className="mt-4 text-base font-semibold text-slate-900">Balanced responsibilities</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">These terms define where the platform helps facilitate sessions and where direct mentor-learner responsibility applies.</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <Shield className="h-5 w-5 text-violet-600" />
          <h2 className="mt-4 text-base font-semibold text-slate-900">Trust and protection</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Verification, conduct standards, and payment rules are included to reduce disputes and protect both sides.</p>
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

export default Terms;
