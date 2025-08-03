import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface Voice {
  id: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export interface TextToSpeechSettings {
  enabled: boolean;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  autoRead: boolean;
}

const DEFAULT_SETTINGS: TextToSpeechSettings = {
  enabled: false,
  voice: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  autoRead: false,
};

export const useTextToSpeech = () => {
  const { i18n } = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [settings, setSettings] = useState<TextToSpeechSettings>(DEFAULT_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize text-to-speech support
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      loadVoices();
      
      // Load saved settings
      const savedSettings = localStorage.getItem('tts-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (error) {
          console.error('Error loading TTS settings:', error);
        }
      }
    }
  }, []);

  // Load available voices
  const loadVoices = useCallback(() => {
    const availableVoices = speechSynthesis.getVoices();
    const voiceList: Voice[] = availableVoices.map((voice, index) => ({
      id: `${voice.name}-${index}`,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
      default: voice.default,
    }));
    
    setVoices(voiceList);
    
    // Auto-select voice based on current language if none selected
    if (!settings.voice && voiceList.length > 0) {
      const currentLang = i18n.language;
      const matchingVoice = voiceList.find(voice => 
        voice.lang.startsWith(currentLang) || voice.lang.includes(currentLang)
      );
      
      if (matchingVoice) {
        setSettings(prev => ({ ...prev, voice: matchingVoice.id }));
      } else {
        // Fallback to first available voice
        setSettings(prev => ({ ...prev, voice: voiceList[0].id }));
      }
    }
  }, [i18n.language, settings.voice]);

  // Handle voices loaded event
  useEffect(() => {
    if (isSupported) {
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, [isSupported, loadVoices]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('tts-settings', JSON.stringify(settings));
  }, [settings]);

  // Get the selected voice object
  const getSelectedVoice = useCallback(() => {
    const availableVoices = speechSynthesis.getVoices();
    const voiceIndex = voices.findIndex(v => v.id === settings.voice);
    return availableVoices[voiceIndex] || availableVoices[0];
  }, [voices, settings.voice]);

  // Speak text
  const speak = useCallback((text: string, options?: Partial<TextToSpeechSettings>) => {
    if (!isSupported || !settings.enabled) return;

    // Stop any current speech
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getSelectedVoice();
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = options?.rate || settings.rate;
    utterance.pitch = options?.pitch || settings.pitch;
    utterance.volume = options?.volume || settings.volume;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, settings, getSelectedVoice]);

  // Pause speech
  const pause = useCallback(() => {
    if (isSupported && isPlaying && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isPlaying, isPaused]);

  // Resume speech
  const resume = useCallback(() => {
    if (isSupported && isPlaying && isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isPlaying, isPaused]);

  // Stop speech
  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    }
  }, [isSupported]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<TextToSpeechSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Get voices for current language
  const getVoicesForLanguage = useCallback((language: string) => {
    return voices.filter(voice => 
      voice.lang.startsWith(language) || voice.lang.includes(language)
    );
  }, [voices]);

  // Speak question text
  const speakQuestion = useCallback((questionText: string) => {
    if (settings.enabled && questionText) {
      speak(questionText);
    }
  }, [speak, settings.enabled]);

  // Speak answer options
  const speakAnswers = useCallback((answers: string[]) => {
    if (settings.enabled && answers.length > 0) {
      const answersText = answers.map((answer, index) => 
        `Option ${index + 1}: ${answer}`
      ).join('. ');
      speak(answersText);
    }
  }, [speak, settings.enabled]);

  // Speak feedback
  const speakFeedback = useCallback((feedback: string) => {
    if (settings.enabled && feedback) {
      speak(feedback);
    }
  }, [speak, settings.enabled]);

  return {
    isSupported,
    voices,
    settings,
    isPlaying,
    isPaused,
    speak,
    pause,
    resume,
    stop,
    updateSettings,
    getVoicesForLanguage,
    speakQuestion,
    speakAnswers,
    speakFeedback,
  };
};