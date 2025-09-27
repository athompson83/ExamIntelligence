import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Play, Pause, Square, Settings } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface TextToSpeechControlsProps {
  compact?: boolean;
  showSettings?: boolean;
}

export const TextToSpeechControls: React.FC<TextToSpeechControlsProps> = ({
  compact = false,
  showSettings = true
}) => {
  const { t } = useTranslation();
  const {
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
    getVoicesForLanguage
  } = useTextToSpeech();

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">
        {t('accessibility.textToSpeech.notSupported', 'Text-to-speech is not supported in this browser')}
      </div>
    );
  }

  const handleVoiceChange = (voiceId: string) => {
    updateSettings({ voice: voiceId });
  };

  const handleTestVoice = () => {
    const testText = t('accessibility.textToSpeech.voicePreview', 'This is a test of the selected voice');
    speak(testText);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={settings.enabled}
          onCheckedChange={(enabled) => updateSettings({ enabled })}
          id="tts-enabled"
        />
        <Label htmlFor="tts-enabled" className="text-sm">
          {settings.enabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Label>
        
        {settings.enabled && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={isPlaying ? (isPaused ? resume : pause) : () => {}}
              disabled={!isPlaying}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={stop}
              disabled={!isPlaying}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          {t('accessibility.textToSpeech.voiceSettings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable TTS */}
        <div className="flex items-center justify-between">
          <Label htmlFor="tts-enable">
            {t('accessibility.textToSpeech.enable')}
          </Label>
          <Switch
            id="tts-enable"
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Voice Selection */}
            <div className="space-y-2">
              <Label>{t('accessibility.textToSpeech.selectVoice')}</Label>
              <Select value={settings.voice} onValueChange={handleVoiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name} ({voice.lang})
                      {voice.default && ' - Default'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Test */}
            <Button
              variant="outline"
              onClick={handleTestVoice}
              className="w-full"
            >
              {t('accessibility.textToSpeech.voicePreview')}
            </Button>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={isPlaying ? (isPaused ? resume : pause) : () => {}}
                disabled={!isPlaying}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {t('accessibility.textToSpeech.play')}
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    {t('accessibility.textToSpeech.pause')}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={stop}
                disabled={!isPlaying}
              >
                <Square className="h-4 w-4 mr-2" />
                {t('accessibility.textToSpeech.stop')}
              </Button>
            </div>

            {showSettings && (
              <>
                {/* Speech Rate */}
                <div className="space-y-2">
                  <Label>
                    {t('accessibility.textToSpeech.speechRate')}: {settings.rate.toFixed(1)}x
                  </Label>
                  <Slider
                    value={[settings.rate]}
                    onValueChange={([rate]) => updateSettings({ rate })}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Speech Pitch */}
                <div className="space-y-2">
                  <Label>
                    {t('accessibility.textToSpeech.speechPitch')}: {settings.pitch.toFixed(1)}
                  </Label>
                  <Slider
                    value={[settings.pitch]}
                    onValueChange={([pitch]) => updateSettings({ pitch })}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Volume */}
                <div className="space-y-2">
                  <Label>
                    {t('accessibility.textToSpeech.speechVolume')}: {Math.round(settings.volume * 100)}%
                  </Label>
                  <Slider
                    value={[settings.volume]}
                    onValueChange={([volume]) => updateSettings({ volume })}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Auto-read Questions */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-read">
                    {t('accessibility.textToSpeech.autoRead')}
                  </Label>
                  <Switch
                    id="auto-read"
                    checked={settings.autoRead}
                    onCheckedChange={(autoRead) => updateSettings({ autoRead })}
                  />
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TextToSpeechControls;