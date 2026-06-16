/**
 * Shared Clerk `appearance` config that maps Clerk's themeable elements onto
 * Inboxly's own design tokens (see globals.css), so auth UI — the embedded
 * <SignIn>/<SignUp> screens and <UserButton> — reads as part of the product
 * rather than a default Clerk widget. Variables reference CSS vars, so it
 * adapts to light/dark automatically.
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
  colorSuccess: "var(--color-success)",
  colorWarning: "var(--color-warning)",
  colorShadow: "transparent",
  fontFamily: "var(--font-sans)",
  borderRadius: "var(--radius-ctl)",
};

const sharedElements = {
  rootBox: "w-full",
  cardBox: "w-full rounded-2xl shadow-none hairline",
  card: "bg-panel rounded-2xl shadow-none border-0 gap-2 px-8 py-8",
  header: "gap-1",
  headerTitle: "text-ink text-xl font-semibold tracking-tight",
  headerSubtitle: "text-ink-2 text-sm",
  socialButtonsBlockButton:
    "h-11 rounded-[var(--radius-ctl)] hairline bg-surface hover:bg-surface-hover text-ink shadow-none transition-colors",
  socialButtonsBlockButtonText: "text-ink font-medium",
  socialButtonsProviderIcon: "h-[18px] w-[18px]",
  dividerLine: "bg-line",
  dividerText: "text-ink-3 text-xs",
  formFieldLabel: "text-ink-2 text-sm",
  formFieldInput:
    "h-11 rounded-[var(--radius-ctl)] bg-surface hairline text-ink shadow-none transition-colors focus:border-accent",
  formFieldInputShowPasswordButton: "text-ink-2 hover:text-ink",
  formFieldAction: "text-accent hover:text-accent-light",
  formFieldErrorText: "text-danger",
  formFieldHintText: "text-ink-3",
  formButtonPrimary:
    "h-11 rounded-[var(--radius-ctl)] bg-accent hover:bg-accent-light text-accent-ink shadow-none normal-case font-medium transition-colors",
  formButtonReset: "text-ink-2 hover:text-ink",
  formResendCodeLink: "text-accent hover:text-accent-light",
  footer: "bg-transparent",
  footerActionText: "text-ink-3",
  footerActionLink: "text-accent hover:text-accent-light font-medium",
  identityPreview: "bg-surface hairline shadow-none rounded-[var(--radius-ctl)]",
  identityPreviewText: "text-ink",
  identityPreviewEditButton: "text-accent hover:text-accent-light",
  otpCodeFieldInput: "bg-surface hairline text-ink shadow-none rounded-[var(--radius-ctl)]",
  alert: "bg-surface hairline shadow-none rounded-[var(--radius-ctl)]",
  alertText: "text-ink",
  badge: "hidden",
  userButtonPopoverCard: "bg-panel hairline shadow-none rounded-2xl",
  userButtonPopoverActionButton: "text-ink hover:bg-surface-hover",
  userButtonPopoverFooter: "hidden",
};

/** Used by `<ClerkProvider>` so every Clerk component matches the theme. */
export const clerkAppearance = {
  variables: sharedVariables,
  elements: sharedElements,
};
