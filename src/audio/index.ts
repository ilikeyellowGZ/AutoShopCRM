/**
 * Audio Processing Module
 * 
 * Exports all audio processing interfaces and types for the language-learning application.
 * 
 * Feature: production-readiness-implementation
 * Requirements: 3.1, 3.3, 3.4 (Audio Pronunciation Pipeline)
 */

// Export all interfaces and types
export * from './interfaces';

// Re-export commonly used types for convenience
export type {
  AudioPipeline,
  PronunciationScore,
  AudioConfig,
  RecordingSession,
  AudioBuffer,
  PronunciationModel,
  PhoneticSegment,
  WaveformData,
  MicrophonePermissionStatus
} from './interfaces';

// Export constants
export {
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_SCORING_CONFIG,
  DEFAULT_CACHE_CONFIG
} from './interfaces';

// Export utility functions
export {
  isValidAudioConfig,
  isValidPronunciationScore,
  createDefaultRecordingSession
} from './interfaces';

/**
 * Audio processing module version
 */
export const AUDIO_MODULE_VERSION = '1.0.0';

/**
 * Module metadata
 */
export const audioModuleMetadata = {
  name: 'audio-processing',
  version: AUDIO_MODULE_VERSION,
  description: 'Audio processing interfaces for language-learning application',
  requirements: ['3.1', '3.3', '3.4'],
  dependencies: ['expo-audio', 'react-native-webrtc'],
  createdAt: new Date().toISOString()
};