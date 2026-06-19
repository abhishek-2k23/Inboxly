import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Terms & Conditions — Inboxly",
  description: "Read the terms and conditions governing your use of Inboxly.",
};

const LAST_UPDATED = "June 19, 2026";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-ink text-4xl font-bold tracking-tight sm:text-5xl">
              Terms &amp; Conditions
            </h1>
            <p className="text-ink-2 mt-4 text-sm">Last updated: {LAST_UPDATED}</p>

            <div className="mt-12 space-y-10">
              <Section title="1. Acceptance of Terms">
                <p>
                  By accessing or using Inboxly (&quot;Service&quot;), you agree to be bound by
                  these Terms &amp; Conditions (&quot;Terms&quot;). If you do not agree to these
                  Terms, you may not use the Service.
                </p>
                <p>
                  These Terms apply to all users, including visitors, registered users, and paying
                  subscribers. We reserve the right to update these Terms at any time.
                </p>
              </Section>

              <Section title="2. Description of Service">
                <p>
                  Inboxly is an AI-powered workspace that integrates with your Gmail and Google
                  Calendar to help you read, draft, send, and organize emails, schedule events, and
                  manage your workday more efficiently.
                </p>
                <p>
                  The Service is provided &quot;as is.&quot; Features may change without notice as
                  we continue to develop and improve the platform.
                </p>
              </Section>

              <Section title="3. Eligibility">
                <p>
                  You must be at least 13 years old to use Inboxly. By using the Service, you
                  represent that you meet this requirement and that you have the legal capacity to
                  enter into a binding agreement.
                </p>
              </Section>

              <Section title="4. Account Registration">
                <p>
                  You are responsible for maintaining the confidentiality of your account
                  credentials and for all activity that occurs under your account. You agree to
                  notify us immediately at{" "}
                  <a href="mailto:support@inboxly.ai" className="text-accent hover:underline">
                    support@inboxly.ai
                  </a>{" "}
                  if you suspect unauthorized access.
                </p>
                <p>
                  We reserve the right to terminate or suspend accounts that violate these Terms.
                </p>
              </Section>

              <Section title="5. Google Account Integration">
                <p>
                  By connecting your Google account, you authorize Inboxly to access your Gmail and
                  Google Calendar data in accordance with the permissions you grant via Google
                  OAuth. You may revoke this access at any time through your Google Account settings
                  or within Inboxly.
                </p>
                <p>
                  Your use of Google services through Inboxly is also subject to{" "}
                  <a
                    href="https://policies.google.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Google&apos;s Terms of Service
                  </a>
                  .
                </p>
              </Section>

              <Section title="6. Acceptable Use">
                <p>You agree not to use Inboxly to:</p>
                <ul>
                  <li>Send spam, phishing emails, or unsolicited bulk messages</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the intellectual property rights of others</li>
                  <li>Transmit malware, viruses, or other harmful code</li>
                  <li>Attempt to reverse-engineer, hack, or disrupt the Service</li>
                  <li>Impersonate any person or entity</li>
                  <li>Harass, abuse, or harm other users</li>
                </ul>
                <p>
                  We reserve the right to investigate and take appropriate action, including
                  suspending or terminating accounts that violate this policy.
                </p>
              </Section>

              <Section title="7. Subscription and Billing">
                <p>
                  Inboxly offers Free, Pro, and Team subscription tiers. Paid subscriptions are
                  billed monthly. By subscribing to a paid plan, you authorize us to charge the
                  payment method on file at the then-current rate.
                </p>
                <p>
                  Prices are listed in INR and may change with 30 days&apos; notice. Refunds are
                  handled on a case-by-case basis — contact{" "}
                  <a href="mailto:billing@inboxly.ai" className="text-accent hover:underline">
                    billing@inboxly.ai
                  </a>{" "}
                  within 7 days of a charge for refund requests.
                </p>
                <p>
                  You may cancel your subscription at any time. Cancellation takes effect at the end
                  of the current billing period; no partial refunds are issued.
                </p>
              </Section>

              <Section title="8. Intellectual Property">
                <p>
                  All content, software, designs, and trademarks associated with Inboxly are owned
                  by us or our licensors. You may not copy, modify, distribute, or create derivative
                  works without our express written permission.
                </p>
                <p>
                  You retain ownership of the content you create (emails, calendar events). By using
                  Inboxly, you grant us a limited, non-exclusive license to process this content
                  solely to provide the Service to you.
                </p>
              </Section>

              <Section title="9. AI-Generated Content">
                <p>
                  Inboxly uses AI models to generate email drafts, summaries, and other content.
                  AI-generated output may contain errors or inaccuracies. You are solely responsible
                  for reviewing and approving any AI-generated content before sending it. Inboxly is
                  not liable for the consequences of sending AI-generated content.
                </p>
              </Section>

              <Section title="10. Disclaimers and Limitation of Liability">
                <p>
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS
                  OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
                  PURPOSE, OR NON-INFRINGEMENT.
                </p>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, INBOXLY SHALL NOT BE LIABLE FOR
                  ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
                  LOSS OF DATA, REVENUE, OR PROFITS, ARISING FROM YOUR USE OF THE SERVICE.
                </p>
                <p>
                  OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR THE SERVICE
                  SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
              </Section>

              <Section title="11. Indemnification">
                <p>
                  You agree to indemnify and hold harmless Inboxly and its officers, directors,
                  employees, and agents from any claims, damages, or expenses (including reasonable
                  legal fees) arising from your use of the Service or violation of these Terms.
                </p>
              </Section>

              <Section title="12. Termination">
                <p>
                  We may suspend or terminate your access to the Service at any time, with or
                  without cause, with or without notice. Upon termination, your right to use the
                  Service ceases immediately. Provisions that by their nature should survive
                  termination shall survive.
                </p>
              </Section>

              <Section title="13. Governing Law">
                <p>
                  These Terms are governed by the laws of India, without regard to its conflict of
                  law principles. Any disputes arising from these Terms shall be subject to the
                  exclusive jurisdiction of the courts of India.
                </p>
              </Section>

              <Section title="14. Changes to Terms">
                <p>
                  We reserve the right to modify these Terms at any time. We will notify you of
                  material changes via email or in-app notice. Continued use of the Service after
                  changes are effective constitutes acceptance of the revised Terms.
                </p>
              </Section>

              <Section title="15. Contact Us">
                <p>For questions about these Terms, please contact us at:</p>
                <address className="not-italic">
                  <strong>Inboxly</strong>
                  <br />
                  Email:{" "}
                  <a href="mailto:legal@inboxly.ai" className="text-accent hover:underline">
                    legal@inboxly.ai
                  </a>
                </address>
              </Section>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-ink text-xl font-semibold">{title}</h2>
      <div className="text-ink-2 [&_a]:text-accent [&_strong]:text-ink mt-4 space-y-3 text-sm leading-relaxed [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}
