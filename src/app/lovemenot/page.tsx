import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/site/Section";
import ProductHero from "@/components/site/ProductHero";
import FeatureGrid from "@/components/site/FeatureGrid";
import ProductCTA from "@/components/site/ProductCTA";

export const metadata: Metadata = {
  title: "Love-Me-Not — Forensic psychology, in your pocket",
  description:
    "Love-Me-Not is a multimodal mobile app for detecting manipulation, gaslighting, and Dark Triad patterns across text, image, video, and audio.",
};

export default function LoveMeNotPage() {
  return (
    <>
      <ProductHero
        eyebrow="Experiment · Forensic psychology"
        status="Experimental"
        title={
          <>
            Forensic psychology, <span className="text-white/55">in your pocket.</span>
          </>
        }
        description="Love-Me-Not is a multimodal mobile app that analyzes text, images, video, and audio for manipulation tactics, gaslighting patterns, and Dark Triad markers — built for people who need clarity, fast."
        primaryCta={{ href: "/waitlist", label: "Join the beta" }}
        secondaryCta={{ href: "/projects", label: "See related work" }}
        image={{ src: "/assets/app_mockup.png", alt: "Love-Me-Not app" }}
        chips={["Mobile", "Multimodal", "Forensic", "On-device first"]}
      />

      <Section className="py-20">
        <SectionHead
          eyebrow="What it does"
          title="Patterns, not personalities."
          description="The app surfaces patterns in communication you already noticed but couldn't articulate. It does not diagnose people; it labels behaviors."
        />
        <div className="mt-10">
          <FeatureGrid
            features={[
              { title: "Text analysis", description: "Detect gaslighting, DARVO, love-bombing, and manipulation patterns in chat history with timeline views." },
              { title: "Image + video review", description: "Visual cues for inconsistency, staged scenarios, and selective context across attached media." },
              { title: "Audio screening", description: "Tone, cadence, and word-pattern markers across calls and voice notes." },
              { title: "Pattern timeline", description: "Frequency, escalation, and de-escalation rhythms — visualized over weeks and months." },
              { title: "Private by default", description: "On-device inference first. Cloud is opt-in, scoped, and time-boxed." },
              { title: "Resources, not verdicts", description: "Every flagged pattern links to literature and crisis resources — not a label about the other person." },
            ]}
          />
        </div>
      </Section>

      <ProductCTA
        eyebrow="Caveat"
        title="A tool for clarity, not a diagnostic."
        description="Love-Me-Not is built to help users notice patterns in their own experience. It is not a clinical tool. If you are in danger, please contact local emergency services."
        primaryCta={{ href: "/waitlist", label: "Join the beta" }}
      />
    </>
  );
}
