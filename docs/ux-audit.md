# Product UX concept

## 1. Improved concept

Conqueror Studios should present as a **trustworthy AI-agent control plane**, not a
collection of experiments. The primary promise is: build a workflow, review what it
will do, run it, and understand every decision afterward. “Request early access” is
the primary public action; “Explore products” is the lower-commitment path.

The public site should answer, in order: what this is, who it is for, why it is safer
than an opaque agent, what products exist, and how to start. The authenticated console
should follow a repeated **Build → Review → Run → Inspect** mental model.

## 2. Screen-by-screen recommendations

- **Home:** Lead with the outcome and trust promise. Follow with four capabilities,
  flagship products, the operating thesis, proof, then one conversion panel. Avoid
  repository counts as proof; use working demos, trace examples, and documented
  controls when available.
- **Products:** Add task-based filters (orchestration, voice, apps), a consistent
  maturity label, intended user, outcome, and one next action per card.
- **Product detail:** Use the same sequence: outcome, demo, how it works, controls,
  current maturity, limitations, and CTA. Separate available features from roadmap.
- **Waitlist:** Explain what access includes, expected response time, data use, and
  next steps. Keep the form to email, role, and use case; confirm submission inline.
- **Sign in:** Explain magic links before requesting an email and provide clear
  sending, sent, expired-link, and retry states.
- **Console / agents:** Start with a useful empty state and template choices. Make
  status, last run, owner, and next action scannable. Keep “create agent” persistent.
- **Agent detail / run:** Separate configuration from run history. Require a review
  step before execution; show permissions, tools, estimated cost, and stop controls.
- **Trace:** Present an event timeline with duration, model/tool, inputs and outputs,
  cost, and errors. Raw JSON is secondary but always available.
- **Settings and billing:** Group workspace, providers, security, and billing. Show
  save state, validation near the field, destructive-action confirmation, and a
  visible audit trail.

## 3. Component system

- **Foundations:** 4/8px spacing grid; near-black surfaces; white primary text; one
  warm-red action color; semantic green, amber, and red reserved for state; Orbitron
  only for display headings; Inter for reading; mono for metadata.
- **Actions:** Primary, secondary, quiet, and destructive buttons with 44px minimum
  touch targets, visible focus, disabled, busy, and success states.
- **Navigation:** Global header, mobile disclosure, breadcrumbs in deep console
  routes, local tabs, and a command/search affordance when the console grows.
- **Data display:** Product card, agent card, status badge with icon and text, metric,
  timeline event, key/value row, table, filter bar, and pagination.
- **Feedback:** Skeleton, progress indicator, empty-state panel, inline field error,
  alert, toast for non-critical confirmation, and full error boundary with retry.
- **Forms:** Label, hint, control, error, and character/format guidance. Never use
  placeholder text as a label.

## 4. Design direction

Keep the current technical, HUD-inspired identity but reduce decorative noise around
tasks. Large typography and grid texture belong on marketing moments; console screens
should favor calm surfaces, plain language, and high-density scan patterns. Red is a
brand/action accent—not the default border for every element. Motion should clarify
state changes and remain subtle.

## 5. Core user flow

1. Visitor understands the promise and inspects products.
2. Visitor requests access and sees what happens next.
3. Approved user signs in by magic link.
4. User chooses a template or creates an agent.
5. User connects tools and defines goals and constraints.
6. User reviews permissions, estimated usage, and test inputs.
7. User runs the agent and monitors progress.
8. User inspects the trace, resolves errors, and compares revisions.
9. User shares, clones, or promotes the reviewed configuration.

## 6. Accessibility requirements

- Meet WCAG 2.2 AA: 4.5:1 text contrast, 3:1 large-text/UI contrast, keyboard access,
  logical focus order, visible focus, semantic landmarks, and one descriptive H1.
- Provide a skip link, descriptive control names, current-page navigation state,
  44×44px mobile targets, and text/icon status pairs that do not rely on color.
- Announce asynchronous form and run status with appropriate live regions; move focus
  to blocking errors and preserve user input after failures.
- Respect reduced motion, browser zoom to 200%, reflow at 320 CSS pixels, and content
  enlargement without clipping. Give charts and traces textual equivalents.
- Test with keyboard only, VoiceOver/Safari, NVDA/Firefox, axe, and high-contrast mode.

## 7. Implementation priorities

1. **Now:** Clarify homepage promise and CTA, simplify global navigation, add skip and
   focus behavior, improve mobile tap targets, and standardize public-page states.
2. **Next:** Create shared form/feedback primitives and rebuild waitlist, sign-in, and
   agent empty/loading/error states with them.
3. **Then:** Unify agent creation around Build → Review → Run → Inspect; add explicit
   permissions, estimated usage, stop behavior, and trace hierarchy.
4. **Later:** Add search, comparative evaluations, collaboration, audit history, and
   evidence-based trust content after usage data identifies the highest-value paths.

Success measures: homepage-to-product engagement, qualified waitlist completion,
time to first successful run, run failure recovery, trace inspection rate, and
returning weekly active workspaces.
