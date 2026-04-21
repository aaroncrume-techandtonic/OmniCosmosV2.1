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

export const generateHoroscopeImage = async (description: string, name: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string> => {
  const dim = sizeToPx(size);
  const seed = hashString(`${description}|${name}|${size}`);
  const rand = seededRandom(seed);

  const canvas = document.createElement("canvas");
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const grad = ctx.createRadialGradient(dim * 0.5, dim * 0.4, dim * 30 / 1024, dim * 0.5, dim * 0.5, dim * 0.75);
  grad.addColorStop(0, "#1e1b4b");
  grad.addColorStop(0.5, "#0b3a58");
  grad.addColorStop(1, "#020617");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, dim, dim);

  for (let i = 0; i < 380; i++) {
    const x = rand() * dim;
    const y = rand() * dim;
    const radius = rand() * 2.2;
    const alpha = 0.2 + rand() * 0.8;
    ctx.fillStyle = `rgba(230,245,255,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 8; i++) {
    const orb = ctx.createRadialGradient(rand() * dim, rand() * dim, 0, rand() * dim, rand() * dim, dim * (0.2 + rand() * 0.35));
    orb.addColorStop(0, `rgba(34,211,238,${(0.08 + rand() * 0.15).toFixed(3)})`);
    orb.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = orb;
    ctx.fillRect(0, 0, dim, dim);
  }
  ctx.globalCompositeOperation = "source-over";

  ctx.strokeStyle = "rgba(148,163,184,0.28)";
  ctx.lineWidth = Math.max(1, dim / 512);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(dim * (0.4 + rand() * 0.2), dim * (0.42 + rand() * 0.18), dim * (0.26 + rand() * 0.08), dim * (0.08 + rand() * 0.08), rand() * Math.PI, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(224,242,254,0.92)";
  ctx.textAlign = "center";
  ctx.font = `${Math.floor(dim * 0.08)}px serif`;
  ctx.fillText(name || "Omni Cosmos", dim / 2, dim * 0.9);

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
  void base64Image;
  void prompt;
  throw new Error("Animation is unavailable in local mode.");
};

export const generateTTS = async (text: string): Promise<Uint8Array> => {
  const seconds = Math.min(48, Math.max(10, Math.floor(text.split(/\s+/).length * 0.28)));
  return buildPcmTone(seconds);
};