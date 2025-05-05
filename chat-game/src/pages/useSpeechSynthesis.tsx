import { useState, useEffect } from 'react';

type VoiceConfig = {
  id: string;
  name: string;
  rate?: number;
  pitch?: number;
  lang?: string;
  voiceURI?: string;
};

export const VOICE_CONFIGS: VoiceConfig[] = [
  {
    id: 'mature',
    name: 'Mature Male',
    rate: 0.85,
    pitch: 0.7,
    lang: 'en-US',
    voiceURI: 'Microsoft David'
  },
  {
    id: 'young',
    name: 'Young Male',
    rate: 1.2,
    pitch: 1.3,
    lang: 'en-US',
    voiceURI: 'Google UK English Male'
  },
  {
    id: 'female1',
    name: 'Middle-Aged Female',
    rate: 1.0,
    pitch: 1.3,
    lang: 'en-US',
    voiceURI: 'Microsoft Zira'
  },
  {
    id: 'female2',
    name: 'Young Female',
    rate: 1.1,
    pitch: 1.5,
    lang: 'en-GB',
    voiceURI: 'Google UK English Female'
  },
  {
    id: 'default',
    name: 'Default',
    rate: 1.0,
    pitch: 1.0,
    lang: 'en-US'
  }
];

export const useSpeechSynthesis = () => {
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      setSynth(synth);

      const loadVoices = () => {
        const voices = synth.getVoices();
        setVoices(voices);
      };

      synth.onvoiceschanged = loadVoices;
      loadVoices();

      return () => {
        synth.onvoiceschanged = null;
      };
    }
  }, []);

  const speak = (text: string, voiceId: string) => {
    if (!synth) return;

    synth.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    const voiceConfig = VOICE_CONFIGS.find(v => v.id === voiceId) || VOICE_CONFIGS[0];
    
    // Apply voice settings
    utterance.rate = voiceConfig.rate || 1.0;
    utterance.pitch = voiceConfig.pitch || 1.0;
    utterance.lang = voiceConfig.lang || 'en-US';

    // Try to find matching voice
    if (voiceConfig.voiceURI) {
      const matchingVoice = voices.find(v => 
        v.voiceURI.includes(voiceConfig.voiceURI!) || 
        v.name.includes(voiceConfig.voiceURI!)
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    synth.speak(utterance);
  };

  return { speak, voices };
};