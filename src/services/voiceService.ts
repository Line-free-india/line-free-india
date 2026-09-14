// ═══════════════════════════════════════════════════════════════════
// Line Free India — Voice Announcement & Chime Engine (Web Speech API)
// ═══════════════════════════════════════════════════════════════════

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesizes an airport / hospital style dual-tone queue chime
 * without requiring external MP3 downloads.
 */
export function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        resolve();
        return;
      }

      const now = ctx.currentTime;
      
      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: 880.00 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.55);

      setTimeout(resolve, 500);
    } catch {
      resolve();
    }
  });
}

export interface AnnounceOptions {
  tokenNumber: number;
  customerName?: string;
  stationOrChair?: string;
  businessName?: string;
  lang?: 'en' | 'hi';
}

/**
 * Speaks an automated queue announcement in English or Hindi
 */
export async function announceToken(options: AnnounceOptions): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this device.');
    return;
  }

  // Play chime before announcing
  await playChime();

  const lang = options.lang || 'en';
  let speechText = '';

  if (lang === 'hi') {
    speechText = options.stationOrChair
      ? `टोकन नंबर ${options.tokenNumber}, कृपया ${options.stationOrChair} पर आएं।`
      : `टोकन नंबर ${options.tokenNumber}, कृपया काउंटर पर आएं।`;
    if (options.customerName) {
      speechText = `${options.customerName} जी, ` + speechText;
    }
  } else {
    speechText = options.stationOrChair
      ? `Token number ${options.tokenNumber}, please proceed to ${options.stationOrChair}.`
      : `Token number ${options.tokenNumber}, please proceed to the service counter.`;
    if (options.customerName) {
      speechText = `${options.customerName}, ` + speechText;
    }
  }

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.rate = 0.92; // Clear, audible pace
  utterance.pitch = 1.05;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    if (lang === 'hi') {
      const hiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.includes('Hindi'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const inVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India') || v.lang.startsWith('en'));
      if (inVoice) utterance.voice = inVoice;
      utterance.lang = 'en-IN';
    }
  }

  window.speechSynthesis.cancel(); // Cancel any lingering utterances
  window.speechSynthesis.speak(utterance);
}
