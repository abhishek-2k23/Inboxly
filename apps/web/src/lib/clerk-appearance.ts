/**
 * Shared Clerk `appearance` config that maps Clerk's themeable elements onto
 * Inboxly's own design tokens (see globals.css), so auth UI reads as part of
 * the product rather than a default Clerk widget.
 */

const sharedVariables = {
  colorPrimary: "var(--color-accent)",
  colorPrimaryForeground: "var(--color-accent-ink)",
  colorBackground: "var(--color-panel)",
  colorForeground: "var(--color-ink)",
  colorMuted: "var(--color-surface)",
  colorMutedForeground: "var(--color-ink-2)",
  colorInput: "var(--color-surface)",
  colorInputForeground: "var(--color-ink)",
  colorBorder: "var(--color-line)",
  colorRing: "var(--color-accent)",
  colorDanger: "var(--color-prio-urgent)",
  colorShadow: "transparent",
  fontFamily: "var(--font-sans)",
  borderRadius: "var(--radius-ctl)",
};

const sharedElements = {
  cardBox: "shadow-none",
  card: "bg-panel hairline shadow-none",
  headerTitle: "text-ink",
  headerSubtitle: "text-ink-2",
  socialButtonsBlockButton:
    "hairline bg-surface hover:bg-surface-hover text-ink shadow-none transition-colors",
  socialButtonsBlockButtonText: "text-ink",
  dividerLine: "bg-line",
  dividerText: "text-ink-3",
  formFieldLabel: "text-ink-2",
  formFieldInput: "bg-surface hairline text-ink shadow-none focus:border-accent",
  formFieldInputShowPasswordButton: "text-ink-2 hover:text-ink",
  formFieldAction: "text-accent-light hover:text-accent",
  formFieldErrorText: "text-prio-urgent",
  formFieldHintText: "text-ink-3",
  formButtonPrimary:
    "bg-accent hover:bg-accent-light text-accent-ink shadow-none normal-case transition-colors",
  formButtonReset: "text-ink-2 hover:text-ink",
  formResendCodeLink: "text-accent-light hover:text-accent",
  footerActionLink: "text-accent-light hover:text-accent",
  identityPreview: "bg-surface hairline shadow-none",
  identityPreviewText: "text-ink",
  identityPreviewEditButton: "text-accent-light hover:text-accent",
  otpCodeFieldInput: "bg-surface hairline text-ink shadow-none",
  alert: "bg-surface hairline shadow-none",
  alertText: "text-ink",
  badge: "hidden",
  userButtonPopoverCard: "bg-panel hairline shadow-none",
  userButtonPopoverActionButton: "text-ink hover:bg-surface-hover",
};

/** Used by `<ClerkProvider>` so every Clerk component (incl. `<UserButton>`) matches the theme. */
export const clerkAppearance = {
  variables: sharedVariables,
  elements: sharedElements,
};
