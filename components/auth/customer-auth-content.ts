/**
 * Copy for the customer auth screens (/login, /register, /forgot-password,
 * /reset-password). Every claim maps to a shipped feature: the Trips page
 * (reference, status, chauffeur, invoice download), checkout pre-fill from the
 * profile, "Book this route again", and cancellation up to 24 hours before
 * pickup. Checkout needs an account, so nothing here may say otherwise.
 */
export type CustomerAuthScreen = "login" | "register" | "forgot" | "reset"

export interface PanelBeat {
  index: string
  title: string
  body: string
}

interface PanelCopy {
  eyebrow: string
  /** Headline before the gold italic accent. */
  title: string
  accent: string
  body: string
  beats: PanelBeat[]
}

export const PANEL_COPY: Record<CustomerAuthScreen, PanelCopy> = {
  login: {
    eyebrow: "Your account",
    title: "Every trip, in one",
    accent: "place.",
    body: "Sign in to see your upcoming transfers, who is driving, and the invoice for each booking.",
    beats: [
      { index: "01", title: "Trips", body: "Each booking with its reference, pickup time and status, from booked to chauffeur assigned." },
      { index: "02", title: "Chauffeur and car", body: "The chauffeur name and vehicle show on your trip as soon as one is assigned." },
      { index: "03", title: "Invoices", body: "Download a PDF invoice for any paid booking, ready for expenses." },
    ],
  },
  register: {
    eyebrow: "Why sign up",
    title: "Book once. Then book",
    accent: "faster.",
    body: "You need an account to book a transfer. It takes a minute, and every booking after the first is quicker.",
    beats: [
      { index: "01", title: "Checkout fills itself in", body: "Your name and phone number are added to every booking for you." },
      { index: "02", title: "Book this route again", body: "Repeat a past transfer straight from your trip list." },
      { index: "03", title: "Cancel online", body: "Cancel a booking from your account up to 24 hours before pickup." },
    ],
  },
  forgot: {
    eyebrow: "Account recovery",
    title: "Your trips are",
    accent: "safe.",
    body: "A new password changes nothing else. Your bookings, invoices and saved details stay exactly as they are.",
    beats: [
      { index: "01", title: "Check your inbox", body: "The link comes from Infinia Transfers and works for one hour." },
      { index: "02", title: "Nothing arrived?", body: "Look in spam or promotions, then send the link again." },
      { index: "03", title: "Travelling today?", body: "Your confirmation email has the booking reference and pickup details, no sign-in needed." },
    ],
  },
  reset: {
    eyebrow: "Account recovery",
    title: "One last",
    accent: "step.",
    body: "Choose a new password, then sign in with it. Your trips and details are waiting.",
    beats: [
      { index: "01", title: "8 characters or more", body: "A short phrase is easier to remember than a jumble of symbols." },
      { index: "02", title: "Keep it for Infinia", body: "Use a password you do not use on other sites." },
      { index: "03", title: "Link expired?", body: "Reset links last one hour. Ask for a new one from the sign-in page." },
    ],
  },
}

interface FormCopy {
  eyebrow: string
  eyebrowAccent?: string
  title: string
  body: string
  /** Facts under the form card, shown with gold dots like the home hero. */
  trust: string[]
}

export const FORM_COPY: Record<CustomerAuthScreen, FormCopy> = {
  login: {
    eyebrow: "Infinia account",
    eyebrowAccent: "Dubai transfers",
    title: "Welcome back.",
    body: "Sign in with the email you booked with. Your trips, invoices and saved details are waiting.",
    trust: ["Trips and invoices", "Chauffeur details", "Cancel or rebook"],
  },
  register: {
    eyebrow: "Infinia account",
    eyebrowAccent: "Free to open",
    title: "Book faster next time.",
    body: "You need an account to book. Save your details once and every transfer after this one is quicker.",
    trust: ["Free, no card needed", "Name and phone pre-fill at checkout", "Invoices in one place"],
  },
  forgot: {
    eyebrow: "Password recovery",
    title: "Send me a reset link.",
    body: "Enter the email you booked with. We'll send a one-time link that works for one hour.",
    trust: [],
  },
  reset: {
    eyebrow: "Password recovery",
    title: "Pick a new password.",
    body: "Use 8 or more characters. Once it is saved, sign in with your new password.",
    trust: [],
  },
}
