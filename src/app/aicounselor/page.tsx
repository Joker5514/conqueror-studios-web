/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/site/Section";
import ProductHero from "@/components/site/ProductHero";
import FeatureGrid from "@/components/site/FeatureGrid";
import SplitFeature from "@/components/site/SplitFeature";
import ProductCTA from "@/components/site/ProductCTA";

export const metadata: Metadata = {
  title: "AI Counselor — Safety-first conversational care",
  description:
    "A safety-first conversational care companion. AI Counselor blends evidence-based frameworks with clear escalation paths to licensed humans.",
};

export default function AiCounselorPage() {
  return (
    <>
      <ProductHero
        eyebrow="Flagship · Conversational care"
        status="Active development"
        title={
          <>
            Compassion <span className="text-white/55">scaled with safety, not shortcuts.</span>
          </>
        }
        description="AI Counselor is a conversational care companion designed around clinical guardrails. Evidence-based frameworks, transparent escalation, and a hard line at the limits of what an AI should do alone."
        primaryCta={{ href: "/waitlist", label: "Join clinician preview" }}
        secondaryCta={{ href: "/support", label: "Talk to the team" }}
        image={{ src: "/assets/ai_counselor_dashboard.png", alt: "AI Counselor dashboard" }}
        chips={["Clinical guardrails", "Crisis routing", "Multi-modal intake", "HIPAA-aware"]}
      />

      <Section className="py-20">
        <SectionHead
          eyebrow="Design principles"
          title="The hard parts come first."
          description="We started with safety, not features. Everything else is built around clear boundaries, transparent handoffs, and clinician-in-the-loop oversight."
        />
        <div className="mt-10">
          <FeatureGrid
            features={[
              { title: "Crisis detection first", description: "Real-time monitoring for risk signals. When detected, the conversation hands off to a human path, not a longer AI reply." },
              { title: "Evidence-based frameworks", description: "CBT, DBT, and motivational-interviewing techniques implemented as auditable conversation policies, not vibes." },
              { title: "Transparent escalation", description: "The user always knows when they're talking to an AI, when a human will step in, and why." },
              { title: "Clinician in the loop", description: "Licensed clinicians own oversight. AI Counselor augments their caseload; it does not replace their judgment." },
              { title: "Privacy by default", description: "HIPAA-aware data handling, end-to-end encryption, and minimal retention." },
              { title: "Multi-modal intake", description: "Text, voice, and structured assessments — the user picks the surface that feels safest." },
            ]}
          />
        </div>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <SplitFeature
          eyebrow="Handoff"
          title="When the AI stops and the human starts."
          image={{ src: "/assets/ai_counselor_handoff.png", alt: "Handoff diagram" }}
          bullets={[
            { title: "Scoped autonomy", body: "AI Counselor handles psychoeducation, journaling, and skill practice. It does not diagnose." },
            { title: "Explicit triggers", body: "Risk markers, scope limits, and time-in-session caps each route to a human path." },
            { title: "Context preserved", body: "Clinicians see a structured session summary, not a raw transcript dump." },
            { title: "Closed loop", body: "Outcomes feed back into the safety eval suite to prevent regressions over time." },
          ]}
        >
          <p>
            AI Counselor is built to extend a clinician's reach, not bypass it.
            The product is the handoff as much as the conversation.
          </p>
        </SplitFeature>
      </Section>

      <ProductCTA
        title="Clinicians and care orgs: let's pilot together."
        description="We're working with licensed providers and digital health teams on the first deployments."
        primaryCta={{ href: "/waitlist", label: "Apply to pilot" }}
        secondaryCta={{ href: "/support", label: "Contact the team" }}
      />
    </>
  );
}
