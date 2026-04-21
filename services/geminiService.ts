import { HoroscopeReading } from "../types";

// Helper to format text for speech - centralized here for pre-generation
export const formatTextForSpeech = (data: HoroscopeReading) => {
  let text = `Greetings, stardust. Here is your unified cosmic reading. \n\n ${data.summary} \n\n`;
  
  const transitions = [
    "Turning to the stars,",
    "Through the lens of,",
    "The cards reveal,",
    "Spirit guides whisper,",
    "Wisdom from the void,"
  ];

  data.sections.forEach((section, index) => {
    const transition = transitions[index % transitions.length];
    text += `${transition} ${section.title}. ${section.content} \n\n`;
  });
  
  text += "Go forth in light.";
  return text;
};

const iconPalette = ["Sun", "Moon", "Star", "Lotus", "Comet", "Circle"];
const colorPalette = ["#22d3ee", "#6366f1", "#a78bfa", "#f59e0b", "#14b8a6", "#38bdf8"];

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededRandom = (seed: number): (() => number) => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const toTitle = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "General";
  return trimmed
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const buildPcmTone = (seconds: number): Uint8Array => {
  const sampleRate = 24000;
  const totalSamples = Math.max(1, Math.floor(sampleRate * seconds));
  const bytes = new Uint8Array(totalSamples * 2);
  const baseFreq = 192;
  const driftFreq = 0.07;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const drift = Math.sin(2 * Math.PI * driftFreq * t) * 14;
    const freq = baseFreq + drift;
    const envelope = Math.min(1, i / (sampleRate * 0.8)) * Math.min(1, (totalSamples - i) / (sampleRate * 0.8));
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.18 * Math.max(0, envelope);
    const int16 = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    const offset = i * 2;
    bytes[offset] = int16 & 0xff;
    bytes[offset + 1] = (int16 >> 8) & 0xff;
  }

  return bytes;
};

const canvasToBase64Png = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL("image/png").replace("data:image/png;base64,", "");
};

const sizeToPx = (size: "1K" | "2K" | "4K"): number => {
  if (size === "4K") return 2048;
  if (size === "2K") return 1536;
  return 1024;
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image."));
    img.src = src;
  });
};

const getSupportedVideoMimeType = (): string => {
  const options = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  for (const option of options) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(option)) {
      return option;
    }
  }
  return "video/webm";
};

export const generateHoroscopeText = async (
  name: string,
  birthDate: string,
  birthPlace: string,
  focus: string
): Promise<HoroscopeReading> => {
  const safeName = name.trim() || "Seeker";
  const safePlace = birthPlace.trim() || "your origin point";
  const safeFocus = toTitle(focus || "General Guidance");
  const seed = hashString(`${safeName}|${birthDate}|${safePlace}|${safeFocus}`);
  const rand = seededRandom(seed);

  const energies = ["momentum", "clarity", "renewal", "compassion", "discipline", "boldness"];
  const element = ["air", "fire", "water", "earth"][Math.floor(rand() * 4)];
  const energy = energies[Math.floor(rand() * energies.length)];

  const sections = [
    {
      title: "Celestial Current",
      content: `${safeName}, your ${safeFocus.toLowerCase()} path is moving through a ${energy}-focused cycle. Lead with steady ${element} energy and keep your commitments simple but intentional.`
    },
    {
      title: "Tarot Thread",
      content: `The cards point to a transition from uncertainty into practiced confidence. Use one small daily ritual to anchor direction, especially around ${safeFocus.toLowerCase()}.`
    },
    {
      title: "Ancestral Compass",
      content: `Memory and place are allies. Let ${safePlace} remind you that resilience is inherited and activated through action, not perfection.`
    },
    {
      title: "Practical Portal",
      content: `In the next seven days, choose one decision you have delayed and complete it in one session. Momentum follows decisive movement.`
    },
  ].map((section, index) => ({
    ...section,
    icon: iconPalette[index % iconPalette.length],
  }));

  const luckyNumbers = Array.from({ length: 4 }, (_, idx) => {
    return Math.max(1, Math.floor(rand() * 36) + 1 + idx) % 37 || 7;
  });

  const luckyColors = Array.from({ length: 3 }, (_, idx) => {
    return colorPalette[(Math.floor(rand() * colorPalette.length) + idx) % colorPalette.length];
  });

  return {
    summary: `A grounded cosmic reading for ${safeName}: your ${safeFocus.toLowerCase()} arc favors deliberate choices, clear communication, and actions that align with your deeper values.`,
    sections,
    luckyNumbers,
    luckyColors,
  };
};

// --- Astrology helpers ---
const ZODIAC_SIGNS = [
  { name: "Capricorn", glyph: "♑", element: "earth", color: "#78716c", start: [12, 22], end: [1, 19] },
  { name: "Aquarius",  glyph: "♒", element: "air",   color: "#38bdf8", start: [1, 20],  end: [2, 18] },
  { name: "Pisces",    glyph: "♓", element: "water",  color: "#818cf8", start: [2, 19],  end: [3, 20] },
  { name: "Aries",     glyph: "♈", element: "fire",   color: "#f87171", start: [3, 21],  end: [4, 19] },
  { name: "Taurus",    glyph: "♉", element: "earth",  color: "#4ade80", start: [4, 20],  end: [5, 20] },
  { name: "Gemini",    glyph: "♊", element: "air",    color: "#facc15", start: [5, 21],  end: [6, 20] },
  { name: "Cancer",    glyph: "♋", element: "water",  color: "#c4b5fd", start: [6, 21],  end: [7, 22] },
  { name: "Leo",       glyph: "♌", element: "fire",   color: "#fb923c", start: [7, 23],  end: [8, 22] },
  { name: "Virgo",     glyph: "♍", element: "earth",  color: "#a3e635", start: [8, 23],  end: [9, 22] },
  { name: "Libra",     glyph: "♎", element: "air",    color: "#f9a8d4", start: [9, 23],  end: [10, 22] },
  { name: "Scorpio",   glyph: "♏", element: "water",  color: "#dc2626", start: [10, 23], end: [11, 21] },
  { name: "Sagittarius",glyph:"♐", element: "fire",   color: "#a78bfa", start: [11, 22], end: [12, 21] },
];

const ELEMENT_PALETTES: Record<string, [string, string, string]> = {
  fire:  ["#ff4d1c", "#fb923c", "#fde68a"],
  earth: ["#166534", "#4ade80", "#a3e635"],
  air:   ["#38bdf8", "#818cf8", "#e0f2fe"],
  water: ["#1d4ed8", "#818cf8", "#c4b5fd"],
};

const getSunSign = (birthDate: string) => {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return ZODIAC_SIGNS[6]; // Cancer fallback
  const m = d.getMonth() + 1;
  const day = d.getDate();
  for (const sign of ZODIAC_SIGNS) {
    const [sm, sd] = sign.start;
    const [em, ed] = sign.end;
    if (sm === em) {
      if (m === sm && day >= sd && day <= ed) return sign;
    } else if (sm > em) {
      // Wraps year-end (Capricorn)
      if ((m === sm && day >= sd) || (m === em && day <= ed)) return sign;
    } else {
      if ((m === sm && day >= sd) || (m === em && day <= ed)) return sign;
    }
  }
  return ZODIAC_SIGNS[6];
};

// Approximate moon phase (0-7) from a date
const getMoonPhase = (birthDate: string): number => {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return 2;
  // Reference new moon: Jan 6 2000
  const refNew = new Date("2000-01-06").getTime();
  const daysSinceNew = (d.getTime() - refNew) / 86400000;
  const cycle = ((daysSinceNew % 29.53) + 29.53) % 29.53;
  return Math.floor(cycle / (29.53 / 8));
};

const MOON_PHASE_NAMES = [
  "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"
];

// Draw a crescent or full/new moon
const drawMoon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, phase: number) => {
  ctx.save();
  if (phase === 4) {
    // Full moon
    const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6);
    glow.addColorStop(0, "rgba(255,253,220,0.55)");
    glow.addColorStop(1, "rgba(255,253,220,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,253,220,0.9)";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (phase === 0) {
    // New moon – dark circle with faint ring
    ctx.strokeStyle = "rgba(200,200,255,0.25)";
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Crescent / quarter / gibbous
    ctx.fillStyle = "rgba(255,253,220,0.85)";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // Shade the dark portion
    const waxing = phase < 4;
    const shadowX = waxing ? cx + r * 0.35 : cx - r * 0.35;
    ctx.globalCompositeOperation = "destination-out";
    const shadowR = r * (phase === 1 || phase === 7 ? 0.95 : phase === 2 || phase === 6 ? 0.7 : 0.5);
    ctx.fillStyle = "rgba(0,0,0,0.92)";
    ctx.beginPath();
    ctx.arc(shadowX, cy, shadowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
};

// Draw constellation dot pattern
const drawConstellation = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rand: () => number, color: string) => {
  const count = 7 + Math.floor(rand() * 5);
  const stars: [number, number][] = Array.from({ length: count }, () => [
    cx + (rand() * 2 - 1) * r,
    cy + (rand() * 2 - 1) * r * 0.6,
  ]);
  ctx.strokeStyle = `${color}55`;
  ctx.lineWidth = Math.max(0.6, r / 80);
  for (let i = 0; i < stars.length - 1; i++) {
    if (rand() > 0.3) {
      ctx.beginPath();
      ctx.moveTo(stars[i][0], stars[i][1]);
      ctx.lineTo(stars[i + 1][0], stars[i + 1][1]);
      ctx.stroke();
    }
  }
  for (const [sx, sy] of stars) {
    const sr = 1.5 + rand() * 2.5;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7 + rand() * 0.3;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

// Draw personal sigil from name hash as polygon path
const drawSigil = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, seed: number, color: string) => {
  const rand = seededRandom(seed + 77);
  const points = 7 + Math.floor(rand() * 5);
  const angles = Array.from({ length: points }, (_, i) => (i / points) * Math.PI * 2 + rand() * 0.4);
  const radii = Array.from({ length: points }, () => r * (0.55 + rand() * 0.45));

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, r / 60);
  ctx.globalAlpha = 0.45;
  ctx.shadowColor = color;
  ctx.shadowBlur = r * 0.12;
  ctx.beginPath();
  // Connect every other point for star-like sigil
  const skip = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < points; i++) {
    const idx = (i * skip) % points;
    const x = cx + Math.cos(angles[idx]) * radii[idx];
    const y = cy + Math.sin(angles[idx]) * radii[idx];
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

export const generateHoroscopeImage = async (
  description: string,
  name: string,
  size: "1K" | "2K" | "4K" = "1K",
  birthDate?: string,
  birthTime?: string,
): Promise<string> => {
  const dim = sizeToPx(size);
  const seed = hashString(`${description}|${name}|${size}|${birthDate ?? ""}|${birthTime ?? ""}`);
  const rand = seededRandom(seed);

  const sunSign = getSunSign(birthDate ?? "");
  const moonPhase = getMoonPhase(birthDate ?? "");
  const palette = ELEMENT_PALETTES[sunSign.element];

  const canvas = document.createElement("canvas");
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  // ── Background: element-tinted deep space ──
  const bg = ctx.createRadialGradient(dim * 0.5, dim * 0.38, dim * 0.04, dim * 0.5, dim * 0.5, dim * 0.82);
  bg.addColorStop(0, "#1a1535");
  bg.addColorStop(0.45, "#060d1a");
  bg.addColorStop(1, "#020510");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, dim, dim);

  // Elemental haze layer
  ctx.globalCompositeOperation = "screen";
  const hazeGrad = ctx.createRadialGradient(dim * 0.5, dim * 0.42, 0, dim * 0.5, dim * 0.5, dim * 0.65);
  hazeGrad.addColorStop(0, `${palette[0]}22`);
  hazeGrad.addColorStop(0.5, `${palette[1]}14`);
  hazeGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, 0, dim, dim);
  ctx.globalCompositeOperation = "source-over";

  // ── Stars ──
  for (let i = 0; i < 520; i++) {
    const x = rand() * dim;
    const y = rand() * dim;
    const radius = rand() * 1.8;
    const alpha = 0.15 + rand() * 0.85;
    ctx.fillStyle = `rgba(225,240,255,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Nebula orbs tinted by element palette ──
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 10; i++) {
    const orbColor = palette[i % palette.length];
    const ox = rand() * dim;
    const oy = rand() * dim;
    const orb = ctx.createRadialGradient(ox, oy, 0, ox, oy, dim * (0.18 + rand() * 0.32));
    orb.addColorStop(0, `${orbColor}${Math.floor((0.07 + rand() * 0.13) * 255).toString(16).padStart(2, "0")}`);
    orb.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = orb;
    ctx.fillRect(0, 0, dim, dim);
  }
  ctx.globalCompositeOperation = "source-over";

  // ── Orbital ring (sign's orbit path) ──
  ctx.save();
  ctx.strokeStyle = `${palette[1]}55`;
  ctx.lineWidth = Math.max(1, dim / 420);
  ctx.setLineDash([dim / 80, dim / 60]);
  ctx.beginPath();
  ctx.ellipse(dim * 0.5, dim * 0.5, dim * 0.38, dim * 0.24, -0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Second ring, rotated
  ctx.strokeStyle = `${palette[0]}30`;
  ctx.beginPath();
  ctx.ellipse(dim * 0.5, dim * 0.5, dim * 0.44, dim * 0.14, 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── Moon (top-right, scaled) ──
  const moonR = dim * 0.09;
  const moonCx = dim * 0.78;
  const moonCy = dim * 0.18;
  drawMoon(ctx, moonCx, moonCy, moonR, moonPhase);

  // ── Constellation cluster (center-left) ──
  drawConstellation(ctx, dim * 0.3, dim * 0.45, dim * 0.22, seededRandom(seed + 5), palette[2]);

  // ── Personal sigil (center) ──
  drawSigil(ctx, dim * 0.5, dim * 0.5, dim * 0.28, seed, palette[1]);

  // ── Zodiac glyph (large, center, semi-transparent) ──
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.floor(dim * 0.28)}px serif`;
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = sunSign.color;
  ctx.fillText(sunSign.glyph, dim * 0.52, dim * 0.5);
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Zodiac glyph small label (bottom-left arc decoration) ──
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${Math.floor(dim * 0.055)}px serif`;
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = sunSign.color;
  ctx.shadowColor = sunSign.color;
  ctx.shadowBlur = dim * 0.025;
  ctx.fillText(sunSign.glyph, dim * 0.07, dim * 0.88);
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Sun glyph (☉) top-left ──
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${Math.floor(dim * 0.04)}px serif`;
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#fde68a";
  ctx.fillText("☉ " + sunSign.name, dim * 0.07, dim * 0.94);
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Moon phase label (top-right, below moon) ──
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${Math.floor(dim * 0.032)}px sans-serif`;
  ctx.globalAlpha = 0.52;
  ctx.fillStyle = "#e0f2fe";
  ctx.fillText("☽ " + MOON_PHASE_NAMES[moonPhase], dim * 0.92, dim * 0.32);
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Name inscription (bottom center) ──
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `bold ${Math.floor(dim * 0.055)}px serif`;
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = "rgba(224,242,254,0.9)";
  ctx.shadowColor = palette[1];
  ctx.shadowBlur = dim * 0.02;
  ctx.fillText(name || "Omni Cosmos", dim / 2, dim * 0.97);
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Element word watermark ──
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${Math.floor(dim * 0.028)}px sans-serif`;
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = palette[0];
  ctx.fillText(sunSign.element.toUpperCase(), dim * 0.95, dim * 0.97);
  ctx.restore();

  return canvasToBase64Png(canvas);
};

export const editHoroscopeImage = async (base64Image: string, instruction: string): Promise<string> => {
  const image = await loadImage(`data:image/png;base64,${base64Image}`);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.drawImage(image, 0, 0);

  const text = instruction.toLowerCase();
  const wantsWarm = text.includes("gold") || text.includes("sun") || text.includes("warm");
  const wantsCool = text.includes("blue") || text.includes("ice") || text.includes("cyan") || text.includes("cool");
  const wantsDream = text.includes("dream") || text.includes("mist") || text.includes("soft") || text.includes("aura");

  if (wantsWarm) {
    ctx.fillStyle = "rgba(245,158,11,0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (wantsCool) {
    ctx.fillStyle = "rgba(56,189,248,0.16)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (wantsDream) {
    ctx.globalCompositeOperation = "screen";
    const haze = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, 0, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.5);
    haze.addColorStop(0, "rgba(255,255,255,0.18)");
    haze.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
  }

  return canvasToBase64Png(canvas);
};

export const generateHoroscopeVideo = async (base64Image: string, prompt: string): Promise<string> => {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser does not support local video recording.");
  }

  const source = await loadImage(`data:image/png;base64,${base64Image}`);
  const width = 1280;
  const height = 720;
  const fps = 24;
  const durationMs = 5200;
  const seed = hashString(`${prompt}|${source.width}|${source.height}`);
  const rand = seededRandom(seed);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const particles = Array.from({ length: 120 }, () => ({
    x: rand() * width,
    y: rand() * height,
    r: 0.6 + rand() * 2.1,
    drift: 0.1 + rand() * 0.7,
    alpha: 0.25 + rand() * 0.65,
  }));

  const stream = canvas.captureStream(fps);
  const mimeType = getSupportedVideoMimeType();
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];

  const videoReady = new Promise<string>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = () => {
      reject(new Error("Local animation recording failed."));
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(URL.createObjectURL(blob));
    };
  });

  recorder.start(200);

  try {
    const frameInterval = 1000 / fps;
    let elapsed = 0;

    while (elapsed <= durationMs) {
      const p = elapsed / durationMs;

      // Subtle cinematic pan + zoom over the generated image.
      const zoom = 1.08 + 0.05 * Math.sin(p * Math.PI * 2);
      const baseScale = Math.max(width / source.width, height / source.height);
      const scale = baseScale * zoom;
      const drawW = source.width * scale;
      const drawH = source.height * scale;
      const panX = Math.sin(p * Math.PI * 2) * 22;
      const panY = Math.cos(p * Math.PI * 1.6) * 16;
      const dx = (width - drawW) / 2 + panX;
      const dy = (height - drawH) / 2 + panY;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(source, dx, dy, drawW, drawH);

      const vignette = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.25, width * 0.5, height * 0.5, width * 0.8);
      vignette.addColorStop(0, "rgba(3, 7, 18, 0)");
      vignette.addColorStop(1, "rgba(3, 7, 18, 0.58)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      for (const particle of particles) {
        const y = (particle.y + elapsed * 0.02 * particle.drift) % height;
        const pulse = 0.6 + 0.4 * Math.sin((elapsed * 0.003) + particle.x * 0.02);
        ctx.beginPath();
        ctx.arc(particle.x, y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 245, 255, ${(particle.alpha * pulse).toFixed(3)})`;
        ctx.fill();
      }

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, frameInterval);
      });
      elapsed += frameInterval;
    }
  } finally {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    stream.getTracks().forEach((track) => track.stop());
  }

  return await videoReady;
};

export const generateTTS = async (text: string): Promise<Uint8Array> => {
  const seconds = Math.min(48, Math.max(10, Math.floor(text.split(/\s+/).length * 0.28)));
  return buildPcmTone(seconds);
};