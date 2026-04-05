import { useState } from 'react';
import { ChevronDown, ChevronUp, LifeBuoy, ShieldCheck, Sparkles } from 'lucide-react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

const faqs = [
  { q: 'How does Windows Learning work?', a: 'Windows Learning connects learners with verified industry experts for live, 1-on-1 mentoring sessions via video call. Browse mentors by skill, book a session, and learn in real-time.' },
  { q: 'How are mentors verified?', a: 'All mentors undergo Aadhaar/Government ID verification. We also review their professional experience, qualifications, and conduct background checks before approval.' },
  { q: 'What does a session cost?', a: 'Session rates range from ₹500 to ₹3,000 per hour, set by individual mentors. There are no subscription fees — you pay only for the sessions you book.' },
  { q: 'Can I get a refund for a cancelled session?', a: 'Yes! If you cancel 24 hours before the session, you receive a full refund to your wallet. Cancellations within 24 hours receive a 50% refund.' },
  { q: 'How do mentors get paid?', a: 'Mentors receive 80% of the session fee (20% platform commission). Payouts are processed every Friday via bank transfer.' },
  { q: 'What technology is used for sessions?', a: 'Sessions are conducted via Zoom integration. You\'ll receive a meeting link before your scheduled session. No additional software installation is required.' },
  { q: 'How do I become a mentor?', a: 'Click "Join as Mentor" and complete the onboarding process: add your skills, experience, set your rate, and upload a government ID for verification. Approval takes 24-48 hours.' },
  { q: 'Is my data secure?', a: 'Yes. We use AES-256 encryption for sensitive data, PCI-compliant payment processing via Razorpay, and regular security audits to protect your information.' },
  { q: 'Can companies use Windows Learning for team training?', a: 'Absolutely! We offer Corporate Plans with custom pricing for team upskilling. Contact us at corporate@windowslearning.com for details.' },
  { q: 'What if I have an issue with a session?', a: 'You can report any issues through our Help Center or submit a support ticket. Our admin mediation team resolves disputes within 48 hours.' },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <LegalPageLayout
      eyebrow="Support"
      title="Frequently Asked Questions"
      description="Clear answers about booking, payments, mentor verification, refunds, and how learning sessions work on Windows Learning."
      updatedAt="April 5, 2026"
      asideTitle="Need help faster?"
      asideCopy="If your question is account-specific, use the support ticket flow so the team can check your booking, wallet, or mentor status directly."
      accent="radial-gradient(circle at center, rgba(14,165,233,0.28), rgba(255,255,255,0))"
    >
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Helpful before you book</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Check how mentor verification, refunds, payouts, and session delivery work so expectations stay clear on both sides.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Trust and safety</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Verified mentors, wallet-based payments, and support-led dispute handling help keep sessions reliable and financially accountable.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Best for quick answers</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  These answers cover the common product questions people ask before onboarding, booking, or joining a session.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`overflow-hidden rounded-[1.5rem] border transition-all duration-200 ${
                openIndex === i ? 'border-slate-300 bg-slate-50 shadow-sm' : 'border-slate-200 bg-white'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-sm font-semibold leading-6 text-slate-900 sm:text-base">{faq.q}</span>
                {openIndex === i ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                )}
              </button>
              {openIndex === i && (
                <div className="border-t border-slate-200 px-6 py-5">
                  <p className="text-sm leading-7 text-slate-600">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default FAQ;
