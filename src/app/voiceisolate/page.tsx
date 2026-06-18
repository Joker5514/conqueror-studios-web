/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/site/Section";
import ProductHero from "@/components/site/ProductHero";
import FeatureGrid from "@/components/site/FeatureGrid";
import SplitFeature from "@/components/site/SplitFeature";
import ProductCTA from "@/components/site/ProductCTA";

export const metadata: Metadata = {
  title: "VoiceIsolate Pro — Real-time voice isolation",
  description:
    "Studio-grade voice isolation in real time. Low-latency DSP + ML pipeline for podcasts, livestreams, and voice agents.",
};

export default function VoiceIsolatePage() {
  return (
    <>
      <ProductHero
        eyebrow="Flagship · Voice AI"
        status="Research preview"
        title={
          <>
            Studio-grade voice isolation, <span className="text-white/55">in real time.</span>
          </>
        }
        description="VoiceIsolate Pro strips noise, music, and crosstalk from any voice stream with imperceptible latency. Built for podcasters, broadcasters, and voice-first agents that can't afford to sound robotic."
        primaryCta={{ href: "/waitlist", label: "Request a preview build" }}
        secondaryCta={{ href: "#dsp", label: "How it works" }}
        image={{ src: "/assets/voiceisolate_hero.png", alt: "VoiceIsolate Pro" }}
        chips={["DSP", "ML", "Low-latency", "Cross-platform"]}
      />

      <Section className="py-20">
        <SectionHead
          eyebrow="Why it matters"
          title="Most voice AI sounds bad because the input is bad."
          description="No matter how good your model is, garbage in is garbage out. VoiceIsolate Pro fixes the front of the pipeline so everything downstream — STT, TTS, agents — gets a clean signal."
        />
        <div className="mt-10">
          <FeatureGrid
            features={[
              { title: "Real-time isolation", description: "Sub-frame latency. Suitable for live broadcast, calls, and conversational agents." },
              { title: "Multi-source separation", description: "Distinguish overlapping speakers and remove background music, not just hiss." },
              { title: "Cross-platform", description: "Native modules for macOS, Windows, Linux, iOS, and Android. Same model, same behavior." },
              { title: "Plug-and-play", description: "Drop-in audio unit / VST plugin. Or call the SDK from your stack directly." },
              { title: "Predictable cost", description: "Runs locally. No per-minute cloud bill, no surprise spikes during big events." },
              { title: "Tuned for voice AI", description: "Output is optimized for downstream STT — punctuation, prosody, and breath survive cleanup." },
            ]}
          />
        </div>
      </Section>

      <Section id="dsp" className="border-t border-white/10 py-20">
        <SplitFeature
          eyebrow="Architecture"
          title="A hybrid DSP + ML pipeline."
          image={{ src: "/assets/voiceisolate_architecture.png", alt: "VoiceIsolate architecture diagram" }}
          bullets={[
            { title: "Front DSP", body: "Spectral gating, adaptive EQ, and dereverb handle the predictable cases cheaply." },
            { title: "Mid ML", body: "Compact neural separator handles the hard cases — overlapping speech, music, crowd noise." },
            { title: "Tail DSP", body: "Final smoothing and de-essing keeps the output natural, not surgical." },
          ]}
        >
          <p>
            We intentionally don't run a heavyweight neural net on every frame.
            The hybrid pipeline gives us studio quality at a fraction of the
            compute — which is why it can run on a laptop or a phone in real
            time.
          </p>
        </SplitFeature>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <SplitFeature
          reverse
          eyebrow="Pipeline"
          title="DSP-first means it's fast on cheap hardware."
          image={{ src: "/assets/voiceisolate_dsp_pipeline.png", alt: "VoiceIsolate DSP pipeline" }}
        >
          <p>
            Every stage has a budget. We hit a strict end-to-end latency target
            because the ML stage only fires when DSP confidence drops below a
            tuned threshold.
          </p>
        </SplitFeature>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <SectionHead eyebrow="Masterclass" title="See it in motion" />
        <div className="panel-strong mt-8 overflow-hidden rounded-2xl">
          <video
            controls
            preload="metadata"
            poster="/assets/voiceisolate_hero.png"
            className="aspect-video w-full bg-black"
          >
            <source src="/assets/VoiceIsolate_Pro_v24_Masterclass.mp4" type="video/mp4" />
            <track kind="captions" src="" label="English" default />
            Your browser does not support embedded video.
          </video>
        </div>
      </Section>

      <ProductCTA
        title="Preview builds available for design partners."
        description="If you ship voice — podcasts, broadcast, agents — we'd like to put VoiceIsolate Pro in your stack."
        primaryCta={{ href: "/waitlist", label: "Request preview build" }}
        secondaryCta={{ href: "/support", label: "Talk to the team" }}
      />
    </>
  );
}
