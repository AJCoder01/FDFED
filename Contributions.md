# Project Contributions Report

- **Name** : Jayanth Ananthakrishnan
- **Roll Number** : S20240010094
- **Course** : FDFED-1
- **Group** : 15

---

## Developed and Modified Files

The following files were developed or modified as part of my contributions:

### 1. Public Features

#### `src/features/public/HelpPage.jsx`
- Developed the public Help & Support Center containing interactive FAQ accordions covering platform quality standards, provider verification, customer protection warranties, dispute arbitration, and guaranteed fixed INR pricing.
- Added structured support cards linking users to customer protection guidelines, customer support tickets, and arbitration resources.

#### `src/features/public/LandingPage.jsx`
- Implemented the primary landing page experience with an engaging hero section, category navigation tiles, trust highlights, popular service recommendations, and verified customer testimonials.
- Integrated quick search triggers that sync keywords and category selections directly into the service discovery workflow.

#### `src/features/public/PostAJobPage.jsx`
- Built the custom job request submission page enabling users to post non-standard or bespoke service requests when catalog offerings do not match their exact needs.
- Designed form controls capturing service category, Indian address/city, scheduled date preference, target INR budget, and contact info, complete with unique Request ID generation upon confirmation.

#### `src/features/public/ServiceDetailPage.jsx`
- Developed the rich service inspection view presenting service scope, transparent fixed INR pricing breakdowns, estimated durations, provider credentials, customer reviews, and coverage zones.
- Integrated the interactive slot selection calendar and appointment booking trigger with booking intent preservation for guest users.

#### `src/features/public/ServiceSearchPage.jsx`
- Created the service discovery and search engine interface supporting full-text query matching across service titles, descriptions, and categories.
- Implemented multi-faceted filters (category, price range, minimum rating, service mode) and sorting mechanisms (relevance, rating, price low-to-high/high-to-low) synchronized with URL search parameters.

---

### 2. Application Layouts

#### `src/app/layouts/PublicLayout.jsx`
- Constructed the main responsive wrapper layout for public-facing guest screens.
- Implemented the persistent top navigation header with branding, role-based navigation links, role switcher integration, notification indicators, and marketplace footer.

---

### 3. Design System

#### `src/design-system/primitives/PhoneInputField.jsx`
- Engineered a reusable primitive input component specifically tailored for Indian telephone number standards (+91 country code).
- Included phone number parsing (`parsePhoneNumber`), 10-digit national number extraction, sanitization against non-digit inputs, and validation enforcing non-zero leading digits and strict 10-digit bounds.

---

### 4. Authentication

#### `src/features/auth/ArbitratorSignupWizard.jsx`
- Developed a comprehensive multi-step wizard for onboarding licensed dispute arbitrators and legal mediators.
- Handled personal details, legal qualifications, Bar Council registration numbers, years of experience, document upload placeholders, and submission verification with immediate status feedback.

#### `src/features/auth/LoginPage.jsx`
- Implemented the primary authentication portal supporting Customer, Provider, Platform Admin, and Arbitrator roles.
- Included demo credential shortcuts, role-mismatch validation, form validation states, and post-login redirection preserving booking or navigation intent.

#### `src/features/auth/SignupPage.jsx`
- Built the user onboarding and account registration screen with role selection (Customer, Service Provider, and Arbitrator).
- Integrated inline field validation, password confirmation checks, Indian phone number verification, and automatic session initialization upon registration.

---

### 5. Arbitrator Features

#### `src/features/arbitrator/ArbitratorDashboard.jsx`
- Developed the operational dashboard for assigned arbitrators displaying overview metrics (pending disputes, scheduled hearings, resolved cases, and recent awards).
- Built action-oriented case lists allowing arbitrators to review evidence, manage hearing schedules, and issue formal rulings.

#### `src/features/arbitrator/HearingSchedulerPage.jsx`
- Created the hearing scheduling interface enabling arbitrators to set up formal virtual hearing dates, select time slots, and configure video meeting URLs.
- Connected hearing creation to the mock repository to update dispute timelines and dispatch automated notifications to both customer and provider parties.
