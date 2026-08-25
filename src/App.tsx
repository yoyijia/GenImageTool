import { useEffect, useMemo, useState } from "react";
import { ASPECTS, STYLES, VOICES, getAspect, getStyle } from "./lib/catalog";
import { generateCaptionsForSelection } from "./lib/captions";
import { createVersions, downloadImage, retryVersion } from "./lib/images";
import type {
  AspectId,
  BrandVoice,
  CampaignBrief,
  CaptionSet,
  GeneratedImage,
  StyleId,
} from "./types";

const DEFAULT_BRIEF: CampaignBrief = {
  prompt:
    "A sunlit bottle of cold-pressed citrus tonic on a marble cafe table, condensation, linen napkin, summer morning",
  brand: "",
  audience: "",
  voice: "warm",
  cta: "",
  styleId: "lifestyle",
  aspectId: "square",
  versionCount: 4,
};

type Stage = "compose" | "review" | "captions";

function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
      className="rounded-full border border-gold/30 px-3 py-1 text-[11px] tracking-[0.14em] uppercase text-gold hover:bg-gold/10"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export default function App() {
  const [brief, setBrief] = useState<CampaignBrief>(DEFAULT_BRIEF);
  const [stage, setStage] = useState<Stage>("compose");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadedIds, setLoadedIds] = useState<string[]>([]);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [retryCounts, setRetryCounts] = useState<Record<string, number>>({});
  const [captions, setCaptions] = useState<CaptionSet[]>([]);
  const [captionSource, setCaptionSource] = useState<"ai" | "studio" | null>(null);
  const [activeCaption, setActiveCaption] = useState<"instagram" | "linkedin" | "x">("instagram");
  const [busy, setBusy] = useState<"images" | "captions" | null>(null);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [openAiKey, setOpenAiKey] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("genimage.openaiKey");
    if (saved) setOpenAiKey(saved);
  }, []);

  const selectedImages = useMemo(
    () => images.filter((image) => selectedIds.includes(image.id)),
    [images, selectedIds],
  );

  const style = getStyle(brief.styleId);
  const aspect = getAspect(brief.aspectId);

  function update<K extends keyof CampaignBrief>(key: K, value: CampaignBrief[K]) {
    setBrief((current) => ({ ...current, [key]: value }));
  }

  function generateImages() {
    if (!brief.prompt.trim()) {
      setError("Add a prompt describing what you want to see.");
      return;
    }
    setError("");
    setBusy("images");
    setCaptions([]);
    setCaptionSource(null);
    setSelectedIds([]);
    setLoadedIds([]);
    setFailedIds([]);
    setRetryCounts({});
    const next = createVersions(brief);
    setImages(next);
    setStage("review");
    setBusy(null);
  }

  function retryImage(id: string) {
    setImages((current) =>
      current.map((image) => {
        if (image.id !== id) return image;
        const attempt = (retryCounts[id] ?? 0) + 1;
        return retryVersion(image, attempt);
      }),
    );
    setRetryCounts((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    setFailedIds((current) => current.filter((item) => item !== id));
    setLoadedIds((current) => current.filter((item) => item !== id));
  }

  function handleImageError(id: string) {
    const attempt = retryCounts[id] ?? 0;
    if (attempt < 3) {
      retryImage(id);
      return;
    }
    setFailedIds((current) => (current.includes(id) ? current : [...current, id]));
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function writeCaptions() {
    if (!selectedImages.length) {
      setError("Select the versions you want before writing captions.");
      return;
    }
    setError("");
    setBusy("captions");
    try {
      const result = await generateCaptionsForSelection(
        brief,
        selectedImages,
        openAiKey.trim() || undefined,
      );
      setCaptions(result.captions);
      setCaptionSource(result.source);
      setStage("captions");
    } catch {
      setError("Caption writing hit a snag. Try again.");
    } finally {
      setBusy(null);
    }
  }

  function saveKey() {
    localStorage.setItem("genimage.openaiKey", openAiKey.trim());
    setShowSettings(false);
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 font-display text-lg text-gold">
            ✦
          </div>
          <div>
            <p className="font-display text-xl leading-none text-cream">GenImage</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted">
              Marketing assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
          <span className={stage === "compose" ? "text-gold" : ""}>01 Prompt</span>
          <span>/</span>
          <span className={stage === "review" ? "text-gold" : ""}>02 Select</span>
          <span>/</span>
          <span className={stage === "captions" ? "text-gold" : ""}>03 Captions</span>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="ml-3 rounded-full border border-line px-3 py-1 text-cream/80 hover:border-gold/40"
          >
            Keys
          </button>
        </div>
      </header>

      <main className="grid gap-6 px-5 py-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="flex h-fit max-h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-[28px] border border-line bg-panel/80 lg:sticky lg:top-5">
          <div className="scrollbar-thin space-y-5 overflow-y-auto p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Campaign brief</p>
            <h1 className="mt-2 font-display text-3xl leading-tight">
              Prompt it. Style it. Caption it.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Describe the shot, pick a visual world, generate a few versions, then lock your
              favorites and we will write the posts.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Prompt</span>
            <textarea
              value={brief.prompt}
              onChange={(event) => update("prompt", event.target.value)}
              rows={3}
              className="w-full resize-y rounded-2xl border border-line bg-ink-soft px-4 py-3 text-sm leading-relaxed text-cream outline-none focus:border-gold/50"
              placeholder="What should the image look like?"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Brand</span>
              <input
                value={brief.brand}
                onChange={(event) => update("brand", event.target.value)}
                className="w-full rounded-2xl border border-line bg-ink-soft px-3 py-2.5 text-sm outline-none focus:border-gold/50"
                placeholder="Optional"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Audience</span>
              <input
                value={brief.audience}
                onChange={(event) => update("audience", event.target.value)}
                className="w-full rounded-2xl border border-line bg-ink-soft px-3 py-2.5 text-sm outline-none focus:border-gold/50"
                placeholder="Who it's for"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
              Call to action
            </span>
            <input
              value={brief.cta}
              onChange={(event) => update("cta", event.target.value)}
              className="w-full rounded-2xl border border-line bg-ink-soft px-3 py-2.5 text-sm outline-none focus:border-gold/50"
              placeholder="Shop the drop, Book a table..."
            />
          </label>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Brand voice</span>
            <div className="flex flex-wrap gap-2">
              {VOICES.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => update("voice", voice.id as BrandVoice)}
                  className={classNames(
                    "rounded-full px-3 py-1.5 text-xs",
                    brief.voice === voice.id
                      ? "bg-gold text-ink"
                      : "border border-line text-muted hover:text-cream",
                  )}
                >
                  {voice.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Visual style</span>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => update("styleId", item.id as StyleId)}
                  className={classNames(
                    "rounded-2xl border p-2.5 text-left",
                    brief.styleId === item.id
                      ? "border-gold/70 bg-gold/10"
                      : "border-line hover:border-gold/30",
                  )}
                >
                  <span
                    className="mb-1.5 block h-6 rounded-lg"
                    style={{ background: item.swatch }}
                  />
                  <span className="block text-[13px] text-cream">{item.name}</span>
                  <span className="block text-[10px] text-muted">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Format</span>
              <select
                value={brief.aspectId}
                onChange={(event) => update("aspectId", event.target.value as AspectId)}
                className="w-full rounded-2xl border border-line bg-ink-soft px-3 py-2.5 text-sm outline-none"
              >
                {ASPECTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Versions</span>
              <select
                value={brief.versionCount}
                onChange={(event) =>
                  update("versionCount", Number(event.target.value) as 2 | 4 | 6)
                }
                className="w-full rounded-2xl border border-line bg-ink-soft px-3 py-2.5 text-sm outline-none"
              >
                <option value={2}>2 options</option>
                <option value={4}>4 options</option>
                <option value={6}>6 options</option>
              </select>
            </label>
          </div>

          {error ? <p className="text-sm text-blush">{error}</p> : null}
          </div>

          <div className="border-t border-line p-4">
            <button
              type="button"
              onClick={generateImages}
              disabled={busy === "images"}
              className="w-full rounded-full bg-gold py-3 text-sm font-medium tracking-wide text-ink hover:bg-gold-deep disabled:opacity-60"
            >
              {busy === "images" ? "Composing…" : `Generate ${brief.versionCount} versions`}
            </button>
          </div>
        </aside>

        <section className="space-y-5">
          {!images.length ? (
            <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-[32px] border border-dashed border-line bg-panel/40 px-8 text-center">
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{style.name}</p>
              <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight md:text-5xl">
                Your campaign board is empty on purpose.
              </h2>
              <p className="mt-4 max-w-md text-muted">
                Write the scene, choose a style, and we will spin up {brief.versionCount}{" "}
                {aspect.label} versions you can pick from.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gold">
                    {style.name} · {aspect.label}
                  </p>
                  <h2 className="mt-1 font-display text-3xl">Pick the versions you want</h2>
                  <p className="mt-1 text-sm text-muted">
                    Click to select. When you are done, captions write themselves.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={writeCaptions}
                  disabled={!selectedIds.length || busy === "captions"}
                  className="rounded-full bg-cream px-5 py-2.5 text-sm text-ink disabled:opacity-40"
                >
                  {busy === "captions"
                    ? "Writing captions…"
                    : selectedIds.length
                      ? `Done selecting · write captions (${selectedIds.length})`
                      : "Select at least one version"}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {images.map((image) => {
                  const selected = selectedIds.includes(image.id);
                  const loaded = loadedIds.includes(image.id);
                  const failed = failedIds.includes(image.id);
                  return (
                    <article
                      key={image.id}
                      className={classNames(
                        "overflow-hidden rounded-[28px] border bg-panel",
                        selected ? "border-gold ring-1 ring-gold/40" : "border-line",
                      )}
                    >
                      <div className="relative">
                        {!loaded && !failed ? (
                          <div
                            className="skeleton w-full"
                            style={{ aspectRatio: `${image.width} / ${image.height}` }}
                          />
                        ) : null}
                        {failed ? (
                          <div
                            className="flex flex-col items-center justify-center gap-3 bg-ink-soft px-6 text-center text-sm text-muted"
                            style={{ aspectRatio: `${image.width} / ${image.height}` }}
                          >
                            <p>This version did not render.</p>
                            <button
                              type="button"
                              onClick={() => retryImage(image.id)}
                              className="rounded-full bg-gold px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-ink"
                            >
                              Retry this version
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => toggleSelect(image.id)} className="block w-full">
                            <img
                              key={image.url}
                              src={image.url}
                              alt={image.versionLabel}
                              referrerPolicy="no-referrer"
                              onLoad={() =>
                                setLoadedIds((current) =>
                                  current.includes(image.id) ? current : [...current, image.id],
                                )
                              }
                              onError={() => handleImageError(image.id)}
                              className={classNames(
                                "w-full object-cover",
                                loaded ? "block" : "hidden",
                              )}
                            />
                          </button>
                        )}
                        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/75 px-3 py-1 text-[11px] uppercase tracking-[0.14em]">
                          {image.versionLabel}
                        </span>
                        <span
                          className={classNames(
                            "pointer-events-none absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em]",
                            selected ? "bg-gold text-ink" : "bg-ink/75 text-cream",
                          )}
                        >
                          {selected ? "Selected" : "Select"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 text-xs text-muted">
                        <span>Seed {image.seed}</span>
                        <button
                          type="button"
                          onClick={() => downloadImage(image).catch(() => setError("Download failed."))}
                          className="text-gold hover:underline"
                        >
                          Download
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {stage === "captions" && captions.length ? (
            <div className="space-y-4 rounded-[32px] border border-line bg-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Caption studio</p>
                  <h3 className="font-display text-2xl">Ready to post</h3>
                </div>
                <p className="text-xs text-muted">
                  {captionSource === "ai"
                    ? "Written with the connected AI key."
                    : "Written by the built-in marketing studio."}
                </p>
              </div>
              <div className="flex gap-2">
                {(["instagram", "linkedin", "x"] as const).map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setActiveCaption(platform)}
                    className={classNames(
                      "rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.12em]",
                      activeCaption === platform ? "bg-gold text-ink" : "border border-line text-muted",
                    )}
                  >
                    {platform === "x" ? "X / Twitter" : platform}
                  </button>
                ))}
              </div>
              {captions.map((pack) => (
                <div key={pack.imageId} className="rounded-3xl border border-line bg-ink-soft p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gold">{pack.versionLabel}</p>
                    <CopyButton text={pack[activeCaption]} />
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-cream">
                    {pack[activeCaption]}
                  </pre>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-sm">
                    <p className="text-muted">
                      Overlay / sticker: <span className="text-cream">{pack.overlay}</span>
                    </p>
                    <CopyButton text={pack.overlay} label="Copy overlay" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </main>

      {showSettings ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/70 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-line bg-panel p-6">
            <h3 className="font-display text-2xl">Optional AI key</h3>
            <p className="mt-2 text-sm text-muted">
              Images generate without a key. Paste an OpenAI key if you want richer caption writing.
              It stays in this browser only.
            </p>
            <input
              type="password"
              value={openAiKey}
              onChange={(event) => setOpenAiKey(event.target.value)}
              placeholder="sk-..."
              className="mt-4 w-full rounded-2xl border border-line bg-ink-soft px-3 py-2.5 text-sm outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-full px-4 py-2 text-sm text-muted"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveKey}
                className="rounded-full bg-gold px-4 py-2 text-sm text-ink"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
