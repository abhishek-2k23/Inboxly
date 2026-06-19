import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privacy Policy — Inboxly",
  description: "Learn how Inboxly collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "June 19, 2026";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-ink text-4xl font-bold tracking-tight sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="text-ink-2 mt-4 text-sm">Last updated: {LAST_UPDATED}</p>

            <div className="prose-legal mt-12 space-y-10">
              <Section title="1. Introduction">
                <p>
                  Inboxly (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to
                  protecting your privacy. This Privacy Policy explains how we collect, use,
                  disclose, and safeguard your information when you use our AI-powered email and
                  calendar workspace.
                </p>
                <p>
                  By using Inboxly, you agree to the collection and use of information in accordance
                  with this policy. If you do not agree, please discontinue use of our service.
                </p>
              </Section>

              <Section title="2. Information We Collect">
                <h3>2.1 Account Information</h3>
                <p>
                  When you create an account, we collect your name, email address, and
                  authentication credentials provided through our sign-up flow (powered by Clerk).
                </p>
                <h3>2.2 Google Account Data</h3>
                <p>
                  With your explicit consent, we access your Gmail messages and Google Calendar
                  events via Google OAuth scopes. We only request the minimum permissions needed to
                  provide the service:
                </p>
                <ul>
                  <li>Read and send emails on your behalf</li>
                  <li>Read and write calendar events</li>
                </ul>
                <p>
                  We do not sell, share, or use your Gmail or Calendar data to train AI models
                  beyond your personal Inboxly experience.
                </p>
                <h3>2.3 Usage Data</h3>
                <p>
                  We automatically collect information about how you interact with Inboxly,
                  including feature usage, session duration, and error logs, to improve the service.
                </p>
                <h3>2.4 AI Interaction Data</h3>
                <p>
                  Prompts you submit and AI-generated responses may be retained temporarily to
                  maintain conversation context and improve response quality within your session.
                </p>
              </Section>

              <Section title="3. How We Use Your Information">
                <ul>
                  <li>Provide, operate, and maintain the Inboxly service</li>
                  <li>
                    Process and fulfill your requests (email drafts, calendar events, summaries)
                  </li>
                  <li>Improve, personalize, and expand our features</li>
                  <li>Communicate with you about updates, security alerts, and support</li>
                  <li>Detect and prevent fraud, abuse, or security incidents</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </Section>

              <Section title="4. Data Sharing and Disclosure">
                <p>We do not sell your personal data. We may share information with:</p>
                <ul>
                  <li>
                    <strong>Service Providers:</strong> Third-party vendors who help us operate the
                    platform (e.g., cloud hosting, authentication, payment processing). These
                    providers are contractually bound to protect your data.
                  </li>
                  <li>
                    <strong>AI Providers:</strong> To power AI features, your prompts and relevant
                    email context may be sent to Anthropic&apos;s Claude API under their enterprise
                    data protection terms.
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> We may disclose data when required by law
                    or to protect the rights, property, or safety of Inboxly, our users, or the
                    public.
                  </li>
                </ul>
              </Section>

              <Section title="5. Data Retention">
                <p>
                  We retain your account data for as long as your account is active. Google account
                  access tokens are stored encrypted and can be revoked at any time from your Google
                  account settings or within Inboxly. You may request deletion of your account and
                  associated data at any time by contacting us.
                </p>
              </Section>

              <Section title="6. Security">
                <p>
                  We implement industry-standard security measures including encryption at rest and
                  in transit, access controls, and regular security reviews. However, no method of
                  transmission over the Internet is 100% secure, and we cannot guarantee absolute
                  security.
                </p>
              </Section>

              <Section title="7. Your Rights">
                <p>Depending on your jurisdiction, you may have the right to:</p>
                <ul>
                  <li>Access the personal data we hold about you</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Request deletion of your personal data</li>
                  <li>Object to or restrict certain processing</li>
                  <li>Data portability</li>
                  <li>Withdraw consent at any time (for consent-based processing)</li>
                </ul>
                <p>
                  To exercise any of these rights, contact us at{" "}
                  <a href="mailto:privacy@inboxly.ai" className="text-accent hover:underline">
                    privacy@inboxly.ai
                  </a>
                  .
                </p>
              </Section>

              <Section title="8. Cookies and Tracking">
                <p>
                  Inboxly uses cookies and similar technologies to maintain your session, remember
                  your preferences, and analyze usage patterns. You can control cookie settings
                  through your browser, though disabling certain cookies may affect functionality.
                </p>
              </Section>

              <Section title="9. Children's Privacy">
                <p>
                  Inboxly is not intended for users under the age of 13. We do not knowingly collect
                  personal information from children. If we learn we have collected data from a
                  child, we will delete it promptly.
                </p>
              </Section>

              <Section title="10. Changes to This Policy">
                <p>
                  We may update this Privacy Policy periodically. We will notify you of material
                  changes by email or through a prominent notice in the application. Continued use
                  of Inboxly after changes constitutes acceptance of the updated policy.
                </p>
              </Section>

              <Section title="11. Contact Us">
                <p>
                  If you have questions or concerns about this Privacy Policy, please contact us at:
                </p>
                <address className="not-italic">
                  <strong>Inboxly</strong>
                  <br />
                  Email:{" "}
                  <a href="mailto:privacy@inboxly.ai" className="text-accent hover:underline">
                    privacy@inboxly.ai
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
      <div className="text-ink-2 [&_a]:text-accent [&_h3]:text-ink [&_strong]:text-ink mt-4 space-y-3 text-sm leading-relaxed [&_h3]:mt-5 [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}
