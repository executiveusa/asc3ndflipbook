"use client";

import HTMLFlipBook from "react-pageflip";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

type FlipInstance = { pageFlip: () => { flipNext: () => void; flipPrev: () => void; turnToPage: (page: number) => void } };
type PageProps = { children: React.ReactNode; className?: string; number?: string };

const Page = forwardRef<HTMLDivElement, PageProps>(function Page({ children, className = "", number }, ref) {
  const pageRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => pageRef.current as HTMLDivElement);

  useLayoutEffect(() => {
    const page = pageRef.current;
    const content = page?.querySelector<HTMLElement>(".page-content");
    if (!page || !content) return;

    let frame = 0;
    const fit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        for (let level = 0; level <= 3; level += 1) {
          page.dataset.fit = String(level);
          void content.offsetHeight;
          const fitsHeight = content.scrollHeight <= content.clientHeight + 2;
          const fitsWidth = content.scrollWidth <= content.clientWidth + 2;
          if (fitsHeight && fitsWidth) break;
        }
      });
    };

    const observer = new ResizeObserver(fit);
    observer.observe(page);
    observer.observe(content);
    fit();
    window.addEventListener("resize", fit, { passive: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", fit); };
  }, [children]);

  return <article ref={pageRef} data-fit="0" className={`book-page ${className}`}><div className="paper-grain" aria-hidden="true" /><div className="page-content">{children}</div>{number && <span className="page-number">{number}</span>}</article>;
});

const toc = [["01", "Where we began", 3], ["02", "The first real system", 6], ["03", "What is live today", 8], ["04", "Quiet infrastructure", 11], ["05", "What still needs to be done", 13], ["06", "The permanent platform", 16]] as const;

function playPaperSound() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const duration = 0.17;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let soft = 0;
  for (let i = 0; i < data.length; i += 1) { const t = i / data.length; soft = soft * 0.94 + (Math.random() * 2 - 1) * 0.06; data[i] = soft * Math.sin(Math.PI * t) * (1 - t) * 0.045; }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = "lowpass"; filter.frequency.value = 680; gain.gain.value = 0.14;
  source.buffer = buffer; source.connect(filter).connect(gain).connect(ctx.destination); source.start();
  source.onended = () => void ctx.close();
}

export default function Home() {
  const bookRef = useRef<FlipInstance | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sound, setSound] = useState(false);
  const [soundPrompt, setSoundPrompt] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [artifact, setArtifact] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<"spread" | "portrait">("spread");
  const flipTo = useCallback((page: number) => { bookRef.current?.pageFlip().turnToPage(page); setTocOpen(false); }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") bookRef.current?.pageFlip().flipNext();
      if (event.key === "ArrowLeft") bookRef.current?.pageFlip().flipPrev();
      if (event.key === "Escape") { setTocOpen(false); setArtifact(null); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);

  const readerFolio = currentPage === 0
    ? "Cover"
    : currentPage === 1
      ? "Founders"
      : currentPage >= 21
        ? "Back cover"
        : `${String(currentPage - 1).padStart(2, "0")} / 19`;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px), (orientation: portrait)");
    const updateLayout = () => setLayoutMode(query.matches ? "portrait" : "spread");
    updateLayout();
    query.addEventListener("change", updateLayout);
    return () => query.removeEventListener("change", updateLayout);
  }, []);

  return <main className="reading-room">
    <div className="ambient-light" aria-hidden="true" />
    <header className="reader-bar" aria-label="Book controls">
      <button className="wordmark" onClick={() => flipTo(0)}>ASC3ND</button>
      <div className="reader-actions"><button onClick={() => setTocOpen((v) => !v)}>Contents</button><button onClick={() => setSound((v) => !v)} aria-pressed={sound}>Sound {sound ? "on" : "off"}</button><button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}>Full screen</button></div>
    </header>

    {soundPrompt && <aside className="sound-prompt" role="dialog" aria-label="Page sound preference"><p>Page-turn sound?</p><div><button className="gold-button" onClick={() => { setSound(true); setSoundPrompt(false); playPaperSound(); }}>Use sound</button><button className="quiet-button" onClick={() => setSoundPrompt(false)}>Keep quiet</button></div></aside>}

    {tocOpen && <nav className="toc-drawer" aria-label="Table of contents"><div className="drawer-heading"><span>Progress book</span><button onClick={() => setTocOpen(false)}>×</button></div><h2>Contents</h2>{toc.map(([index, label, page]) => <button key={index} onClick={() => flipTo(page)}><span>{index}</span><b>{label}</b></button>)}</nav>}

    <section className={`book-stage ${layoutMode === "portrait" ? "portrait-stage" : "spread-stage"}`} aria-label="ASC3ND progress book">
      <div className="book-shadow" aria-hidden="true" />
      <button className="side-turn side-turn-prev" onClick={() => bookRef.current?.pageFlip().flipPrev()} disabled={currentPage === 0} aria-label="Previous page">←</button>
      <HTMLFlipBook key={layoutMode} ref={bookRef as never} width={620} height={858} minWidth={220} maxWidth={760} minHeight={304} maxHeight={1052} size="stretch" showCover usePortrait={layoutMode === "portrait"} mobileScrollSupport drawShadow flippingTime={960} maxShadowOpacity={0.42} onFlip={(event: { data: number }) => { setCurrentPage(event.data); if (sound) playPaperSound(); }} className="flip-book" style={{}} startPage={currentPage} autoSize clickEventForward useMouseEvents swipeDistance={24} showPageCorners={layoutMode === "spread"} disableFlipByClick={false} startZIndex={0}>

        <Page className="cover front-cover">
          <div className="cover-leather" aria-hidden="true" />
          <div className="cover-tooling" aria-hidden="true" />
          <div className="cover-composition">
            <h1 className="cover-title"><span>The</span><strong>ASC3ND</strong><em>Collective</em></h1>
            <img src="/assets/asc3nd-mark.png" alt="ASC3ND" className="cover-mark" />
            <p className="cover-subtitle">Empower youth.<br />Elevate futures.<br />Build community.</p>
            <p className="cover-domain">asc3nd.org</p>
          </div>
        </Page>

        <Page className="founders-leaf">
          <div className="founders-composition">
            <img src="/assets/asc3nd-mark.png" alt="ASC3ND logo" className="founders-mark" />
            <div className="founders-rule" aria-hidden="true" />
            <p className="founders-eyebrow">The ASC3ND Collective</p>
            <h1>Founders</h1>
            <p className="founders-names">Otha &amp; Elisha Minnifield</p>
            <p className="founded-year">Founded 2026</p>
          </div>
        </Page>

        <Page className="opening-page" number="01"><p className="kicker">ASC3ND Collective · Progress edition</p><h1>Starting small<br /><span className="gold-ink">1st month</span></h1><div className="opening-line" /><p className="opening-deck">ASC3ND began this engagement with a logo image, a newsletter, and an event flyer.<br /><br />Together we have began connecting the public facing ecosystem around your organization.</p><span className="progress-marker">START → FOUNDATION</span></Page>

        <Page className="editorial-page" number="02"><p className="kicker">01 · Where we began</p><p className="chapter-word">An image.<br />A newsletter.<br />A flyer.</p><p className="story-copy">Your mission was already real. Together we are turning that mission into something people can clearly see, understand, join, and remember.</p><p className="margin-note">There was no connected public system yet—just the first pieces.</p><span className="progress-marker">BEFORE</span></Page>

        <Page className="editorial-page dark-leaf" number="03"><p className="kicker">The first job</p><h2 className="display-title warm">We Listen before building.</h2><p className="story-copy pale">Our early meetings were used to understand your organization, the people behind it, your ideas, first event, and what ASC3ND actually needed.<br /><br />The work expanded because the need was bigger than a single website page or a few social posts.</p><p className="margin-note dark-note">The 90-day engagement became about building a usable foundation ASC3ND could keep.</p><span className="progress-marker gold-marker">DISCOVERY</span></Page>

        <Page className="editorial-page" number="04"><p className="kicker">Identity · We now have</p><h2 className="display-title">One name.<br />One place to send people.</h2><p className="story-copy">The ASC3ND identity is becoming consistent across the website, event materials, QR access, social content, and team tools.</p><p className="domain-display compact-domain">asc3nd.org</p><p className="margin-note">A short, memorable address now connects the public experience.</p><span className="progress-marker">IDENTITY</span></Page>

        <Page className="editorial-page dense-page" number="05"><p className="kicker">02 · The first real test</p><h2 className="display-title">Your Community Cuts event becomes your proof for stage 2.</h2><p className="story-copy">The event moved from a static announcement into a working digital journey:</p><p className="flow-copy">Flyer → QR code → Event page → RSVP → Confirmation → Staff check-in</p><p className="margin-note">The public sees one simple path. Your team tracks the logistics.</p><span className="progress-marker">EVENT SYSTEM</span></Page>

        <Page className="image-page" number="06"><img src="/assets/community-cuts-flyer.png" alt="Community Cuts for Kids event flyer" /><span className="artifact-label">Community Cuts for Kids · August 30, 2026</span><p className="image-support">The original event flyer became the starting point for building authentic content.</p></Page>

        <Page className="editorial-page dense-page" number="07"><p className="kicker">03 · What is live today</p><h2 className="display-title">The event experience works.</h2><p className="story-copy compact-copy">ASC3ND now has a live digital event experience with:</p><ul className="compact-list two-column-list"><li>English and Spanish pages</li><li>RSVP registration</li><li>Confirmation codes</li><li>QR access</li><li>Staff login</li><li>RSVP lookup</li><li>Check-in support</li><li>Connected database</li></ul><a className="text-link" href="https://asc3nd.org" target="_blank" rel="noreferrer">Visit asc3nd.org ↗</a><span className="progress-marker">LIVE</span></Page>

        <Page className="editorial-page dense-page" number="08"><p className="kicker">The campaign system</p><h2 className="display-title">Social media now has a rhythm.</h2><p className="story-copy compact-copy">ASC3ND now has a repeatable publishing structure:</p><div className="rhythm"><p><b>Monday</b><span>Identity</span></p><p><b>Wednesday</b><span>Story / Reel</span></p><p><b>Friday</b><span>Community / Event</span></p></div><p className="margin-note">Each post works on its own while the full profile still feels intentional.<br /><br />Following a schedule helps your grid look cohesive and builds a repeatable workflow for you and your team.</p><span className="progress-marker">PUBLISHING SYSTEM</span></Page>

        <Page className="editorial-page dark-leaf dense-page" number="09"><p className="kicker">Content that can keep working</p><h2 className="display-title warm">The event is not the end of the story.</h2><p className="story-copy pale compact-copy">We will help capture the event content.<br /><br />The campaign has been designed so all photos, interviews, testimonials, outcomes, partner moments, and community stories from the event can become the next wave of ASC3ND content and build your main website. The events page becomes a page in your new site and can be updated to match future events.</p><p className="margin-note dark-note">The event gives us the raw material for the permanent brand story.</p><span className="progress-marker gold-marker">CONTENT ENGINE</span></Page>

        <Page className="editorial-page dense-page" number="10"><p className="kicker">04 · Quiet infrastructure</p><h2 className="display-title">Simple outside.<br />Protected underneath.</h2><p className="story-copy compact-copy">Behind the public experience, ASC3ND now has:</p><ul className="compact-list"><li>Domain ownership of asc3nd.org, theasc3ndcollective.org, and theasc3ndcollective.com</li><li>Private database to track engagement</li><li>One year of hosting</li><li>Automated backups</li><li>All digital assets created are 100% property of ASC3ND</li><li>Zero lock-in or extra payment required</li></ul><p className="margin-note">The goal is not complexity. The goal is to give you ownership, control, and a system that works.</p><span className="progress-marker">INFRASTRUCTURE</span></Page>

        <Page className="editorial-page dense-page" number="11"><p className="kicker">Where we are today</p><h2 className="display-title">The foundation is built.</h2><p className="story-copy compact-copy">ASC3ND now has more than individual assets.<br /><br />It has the beginning of a connected operating system:</p><div className="system-lines"><p><b>Public presence</b><span>Website + event pages</span></p><p><b>Operations</b><span>RSVP + staff tools</span></p><p><b>Publishing</b><span>Campaign structure + reusable content system</span></p><p><b>Data</b><span>Real registrations and supporter information</span></p><p><b>Protection</b><span>Backups + monitoring + recovery path</span></p></div><span className="progress-marker">TODAY</span></Page>

        <Page className="editorial-page dense-page" number="12"><p className="kicker">05 · What still needs to be done</p><h2 className="display-title">Now we turn activity into proof.</h2><ol className="priority-list"><li><b>Capture the real event.</b></li><li><b>Collect final attendance, outcomes, photos, video, testimonials, sponsors, volunteers, and partner stories.</b></li><li><b>Turn Community Cuts into a permanent case study.</b></li><li><b>Build the permanent ASC3ND website around programs, impact, stories, partners, and ways to get involved.</b></li><li><b>Edit your after-event footage and connect the remaining social channels.</b></li></ol><p className="margin-note">The next phase is about using what happened—not starting over.</p><span className="progress-marker">NEXT</span></Page>

        <Page className="editorial-page dense-page" number="13"><p className="kicker">Immediately after the event</p><h2 className="display-title">Capture it quickly.</h2><p className="story-copy compact-copy">Within the first week after Community Cuts, we should document:</p><ul className="compact-list two-column-list"><li>How many young people were served</li><li>How many people attended</li><li>Volunteers and barbers</li><li>Sponsors and community partners</li><li>Photos and video</li><li>Parent feedback</li><li>Youth stories where appropriate</li><li>What worked</li><li>What should improve</li></ul><p className="margin-note">These become your evidence for future sponsors, donors, grants, families, schools, and partners.</p><span className="progress-marker">7-DAY ACTION</span></Page>

        <Page className="editorial-page" number="14"><p className="kicker">The first proof asset</p><h2 className="display-title">Community Cuts becomes a case study.</h2><p className="story-copy compact-copy">The permanent story should answer five simple questions:</p><ol className="proof-questions"><li>What need existed?</li><li>What did ASC3ND organize?</li><li>Who came together?</li><li>What happened?</li><li>What comes next?</li></ol><p className="margin-note">This turns one event into proof that ASC3ND can organize, deliver, and create community impact.</p><span className="progress-marker">PROOF</span></Page>

        <Page className="editorial-page dense-page" number="15"><p className="kicker">06 · The permanent ASC3ND website</p><h2 className="display-title">From event site<br />to organization platform.</h2><p className="story-copy compact-copy">Our next website collaboration can organize ASC3ND around what people actually need to do:</p><ul className="compact-list two-column-list"><li>Understand the mission</li><li>See the programs</li><li>Find events</li><li>See real impact</li><li>Read stories</li><li>Volunteer or mentor</li><li>Become a partner</li><li>Sponsor or donate</li></ul><p className="margin-note">The website should become the front door to the organization—not just the home of one event.</p><span className="progress-marker">PLATFORM</span></Page>

        <Page className="editorial-page dark-leaf" number="16"><p className="kicker">The system we are building toward</p><h2 className="display-title warm">One cycle.<br />Repeated.</h2><p className="cycle-flow">Program<br />→ Registration<br />→ Event<br />→ Attendance<br />→ Photos + stories + outcomes<br />→ Social content<br />→ Impact page<br />→ Sponsor / donor proof<br />→ Next program</p><p className="margin-note dark-note">Every program should make the next program easier to grow.</p><span className="progress-marker gold-marker">OPERATING SYSTEM</span></Page>

        <Page className="editorial-page dense-page" number="17"><p className="kicker">The next 30 days</p><h2 className="display-title">Close the event.<br />Publish the proof.<br />Build forward.</h2><div className="week-lines"><p><b>Week 1</b><span>Capture event results and media.</span></p><p><b>Week 2</b><span>Publish the event recap and case study.</span></p><p><b>Week 3</b><span>We work with you to learn permanent ASC3ND programs, partner pathways, and volunteer journeys.</span></p><p><b>Week 4</b><span>We collaborate on new outreach opportunities using Community Cuts as evidence.</span></p></div><span className="progress-marker">30 DAYS</span></Page>

        <Page className="editorial-page dense-page" number="18"><p className="kicker">The next 60 days</p><h2 className="display-title">Turn the foundation into growth.</h2><p className="story-copy compact-copy">The next layer can include:</p><ul className="compact-list two-column-list"><li>Sponsor outreach</li><li>Volunteer management</li><li>Mentor recruitment</li><li>Donation pathways</li><li>Repeatable event templates</li><li>Impact dashboards</li><li>Grant evidence</li><li>Partner CRM</li><li>Newsletter growth</li><li>Automated social publishing</li></ul><p className="margin-note">Only build what increases impact, reduces work, creates proof, grows participation, or brings resources into ASC3ND.</p><span className="progress-marker">90 DAYS</span></Page>

        <Page className="editorial-page closing-leaf" number="19"><p className="kicker">Where this is going</p><h2 className="display-title">A stronger organization.</h2><p className="story-copy">Your vision is clear.<br /><br />The goal now is one recognizable ASC3ND system that helps your team communicate, operate, prove impact, and show the public.</p><p className="closing-signature">One mission.<br />One identity.<br />One system ASC3ND can own.</p></Page>

        <Page className="cover back-cover"><div className="cover-leather" aria-hidden="true" /><div className="cover-tooling" aria-hidden="true" /><div className="back-signature"><img src="/assets/asc3nd-mark.png" alt="ASC3ND" /><span>asc3nd.org</span><b>ASC3ND — with a three.</b></div></Page>
      </HTMLFlipBook>
      <button className="side-turn side-turn-next" onClick={() => bookRef.current?.pageFlip().flipNext()} disabled={currentPage >= 21} aria-label="Next page">→</button>
    </section>

    <footer className="reader-footer"><button onClick={() => bookRef.current?.pageFlip().flipPrev()}>← Previous</button><span>{readerFolio}</span><button onClick={() => bookRef.current?.pageFlip().flipNext()}>Next →</button></footer>
    {artifact && <div className="artifact-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setArtifact(null)}>×</button><img src={artifact} alt="Enlarged ASC3ND campaign artifact" /></div>}
  </main>;
}
