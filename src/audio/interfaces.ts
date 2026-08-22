/**
 * Audio Processing Interfaces
 * 
 * This module defines TypeScript interfaces for audio processing in the language-learning application.
 * 
 * Feature: production-readiness-implementation
 * Requirements: 3.1, 3.3, 3.4 (Audio Pronunciation Pipeline)
 * 
 * @see https://expo.dev/guides/audio for expo-audio library specifications
 */

// ============================================================================
// Core Audio Types
// ============================================================================

/**
 * Audio configuration for recording sessions
 * Based on Requirement 3.1: Capture audio using expo-audio library with 44.1kHz sample rate and 16-bit depth
 */
export interface AudioConfig {
  /** Sample rate in Hz (default: 44100) */
  sampleRate: 44100 | 48000 | 16000 | 8000;
  
  /** Bit depth (default: 16) */
  bitDepth: 8 | 16 | 24 | 32;
  
  /** Number of audio channels (1 = mono, 2 = stereo) */
  channels: 1 | 2;
  
  /** Audio format (default: linear PCM) */
  format: 'linearPCM' | 'aac' | 'mp3' | 'opus';
  
  /** Recording duration limit in seconds (0 = unlimited) */
  durationLimit?: number;
  
  /** Whether to enable real-time waveform visualization */
  enableWaveform: boolean;
  
  /** Waveform update frequency in FPS (default: 30) */
  waveformFPS?: number;
}

/**
 * Audio recording session metadata
 */
export interface RecordingSession {
  /** Unique session identifier */
  id: string;
  
  /** Audio configuration used for this session */
  config: AudioConfig;
  
  /** Session start timestamp */
  startTime: Date;
  
  /** Session duration in milliseconds */
  durationMs: number;
  
  /** Recording state */
  state: 'idle' | 'recording' | 'paused' | 'stopped' | 'processing';
  
  /** File path or URI for recorded audio */
  filePath?: string;
  
  /** Audio buffer if stored in memory */
  audioBuffer?: AudioBuffer;
  
  /** Recording quality metrics */
  metrics: RecordingMetrics;
}

/**
 * Audio recording quality metrics
 */
export interface RecordingMetrics {
  /** Peak amplitude (0.0 to 1.0) */
  peakAmplitude: number;
  
  /** Average amplitude (0.0 to 1.0) */
  averageAmplitude: number;
  
  /** Signal-to-noise ratio in dB */
  snrDb: number;
  
  /** Recording sample count */
  sampleCount: number;
  
  /** Whether the recording meets quality thresholds */
  isQualityRecording: boolean;
}

/**
 * Audio buffer for in-memory audio data
 */
export interface AudioBuffer {
  /** Raw audio samples (PCM format) */
  samples: Float32Array | Int16Array;
  
  /** Sample rate in Hz */
  sampleRate: number;
  
  /** Bit depth */
  bitDepth: number;
  
  /** Number of channels */
  channels: number;
  
  /** Duration in seconds */
  duration: number;
  
  /** Encoding format */
  format: 'float32' | 'int16' | 'int24' | 'int32';
}

/**
 * Pronunciation model for comparison
 */
export interface PronunciationModel {
  /** Unique model identifier */
  id: string;
  
  /** Language code (ISO 639-1) */
  language: string;
  
  /** Text to pronounce */
  text: string;
  
  /** Phonetic transcription (IPA) */
  phoneticTranscription: string;
  
  /** Reference audio data */
  referenceAudio?: AudioBuffer;
  
  /** Phonetic segments with timing */
  segments: PhoneticSegment[];
  
  /** Model metadata */
  metadata: {
    /** Model version */
    version: string;
    
    /** Model confidence threshold */
    confidenceThreshold: number;
    
    /** Whether model is cached locally */
    isCached: boolean;
    
    /** Cache timestamp */
    cachedAt?: Date;
    
    /** Model size in bytes */
    sizeBytes: number;
  };
}

/**
 * Phonetic segment for detailed pronunciation analysis
 */
export interface PhoneticSegment {
  /** Segment identifier */
  id: string;
  
  /** Phoneme or phone representation */
  phoneme: string;
  
  /** Start time in milliseconds */
  startTimeMs: number;
  
  /** End time in milliseconds */
  endTimeMs: number;
  
  /** Expected duration in milliseconds */
  expectedDurationMs: number;
  
  /** Stress pattern (primary, secondary, unstressed) */
  stress?: 'primary' | 'secondary' | 'unstressed';
  
  /** Tone information for tonal languages */
  tone?: number;
}

/**
 * Waveform data point for visualization
 * Based on Requirement 3.2: Real-time waveform visualization with update frequency of 30 frames per second
 */
export interface WaveformData {
  /** Timestamp in milliseconds from recording start */
  timestampMs: number;
  
  /** Amplitude value (normalized 0.0 to 1.0) */
  amplitude: number;
  
  /** Frequency data (optional, for spectrogram visualization) */
  frequencyData?: Float32Array;
  
  /** Whether this point contains speech activity */
  hasSpeech?: boolean;
  
  /** Speech confidence score (0.0 to 1.0) */
  speechConfidence?: number;
}

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Audio Pipeline Interface
 * 
 * Main interface for audio recording, processing, and pronunciation analysis.
 * Based on Design Document section 4: Audio Pipeline
 */
export interface AudioPipeline {
  /**
   * Start recording audio with the specified configuration
   * 
   * @param config Audio configuration for recording
   * @returns Promise resolving to recording session metadata
   */
  startRecording(config: AudioConfig): Promise<RecordingSession>;
  
  /**
   * Stop recording and retrieve the audio buffer
   * 
   * @param sessionId Recording session identifier
   * @returns Promise resolving to audio buffer
   */
  stopRecording(sessionId: string): Promise<AudioBuffer>;
  
  /**
   * Analyze pronunciation by comparing user audio with reference model
   * Based on Requirement 3.3: Compare user speech samples against reference pronunciation models with confidence scoring
   * 
   * @param audio User audio buffer to analyze
   * @param reference Reference pronunciation model
   * @returns Promise resolving to pronunciation score
   */
  analyzePronunciation(audio: AudioBuffer, reference: PronunciationModel): Promise<PronunciationScore>;
  
  /**
   * Get real-time waveform data for visualization
   * Based on Requirement 3.2: Real-time waveform visualization with update frequency of 30 frames per second
   * 
   * @param sessionId Recording session identifier
   * @returns Promise resolving to array of waveform data points
   */
  getWaveformData(sessionId: string): Promise<WaveformData[]>;
  
  /**
   * Cache pronunciation model for offline use
   * Based on Requirement 3.5: Support offline pronunciation practice with minimum 50 cached audio models
   * 
   * @param model Pronunciation model to cache
   * @returns Promise that resolves when caching is complete
   */
  cacheModel(model: PronunciationModel): Promise<void>;
  
  /**
   * Check if microphone permission is granted
   * 
   * @returns Promise resolving to permission status
   */
  checkMicrophonePermission(): Promise<MicrophonePermissionStatus>;
  
  /**
   * Request microphone permission with educational context
   * Based on Requirement 3.6: Display permission request dialog with explanation of microphone usage
   * 
   * @returns Promise resolving to permission status
   */
  requestMicrophonePermission(): Promise<MicrophonePermissionStatus>;
  
  /**
   * Get list of cached pronunciation models
   * 
   * @returns Promise resolving to array of cached model identifiers
   */
  getCachedModels(): Promise<string[]>;
  
  /**
   * Remove pronunciation model from cache
   * 
   * @param modelId Model identifier to remove
   * @returns Promise that resolves when removal is complete
   */
  removeCachedModel(modelId: string): Promise<void>;
  
  /**
   * Get cache statistics
   * 
   * @returns Promise resolving to cache statistics
   */
  getCacheStats(): Promise<CacheStats>;
}

/**
 * Pronunciation Score Interface
 * 
 * Detailed pronunciation analysis results.
 * Based on Design Document section 4: PronunciationScore interface
 */
export interface PronunciationScore {
  /** Overall accuracy percentage (0-100%) */
  accuracy: number;
  
  /** Detailed phonetic breakdown */
  phoneticBreakdown: PhoneticSegment[];
  
  /** Specific improvement recommendations */
  recommendations: string[];
  
  /** Confidence score for the analysis (0.0 to 1.0) */
  confidence: number;
  
  /** Overall feedback based on accuracy */
  feedback: string;
  
  /** Per-phoneme accuracy scores */
  phonemeScores: PhonemeScore[];
  
  /** Timing analysis */
  timingAnalysis: TimingAnalysis;
  
  /** Prosody analysis (rhythm, stress, intonation) */
  prosodyAnalysis: ProsodyAnalysis;
}

/**
 * Phoneme-level accuracy score
 */
export interface PhonemeScore {
  /** Phoneme identifier */
  phoneme: string;
  
  /** Accuracy score (0.0 to 1.0) */
  accuracy: number;
  
  /** Confidence score (0.0 to 1.0) */
  confidence: number;
  
  /** Error type if accuracy is low */
  errorType?: 'substitution' | 'omission' | 'insertion' | 'distortion';
  
  /** Suggested correction */
  suggestedCorrection?: string;
}

/**
 * Timing analysis results
 */
export interface TimingAnalysis {
  /** Speaking rate in words per minute */
  speakingRateWpm: number;
  
  /** Average pause duration in milliseconds */
  averagePauseDurationMs: number;
  
  /** Number of pauses */
  pauseCount: number;
  
  /** Rhythm consistency score (0.0 to 1.0) */
  rhythmConsistency: number;
  
  /** Whether timing is within expected range */
  isWithinExpectedRange: boolean;
}

/**
 * Prosody analysis results
 */
export interface ProsodyAnalysis {
  /** Pitch variation score (0.0 to 1.0) */
  pitchVariation: number;
  
  /** Stress pattern accuracy (0.0 to 1.0) */
  stressAccuracy: number;
  
  /** Intonation pattern accuracy (0.0 to 1.0) */
  intonationAccuracy: number;
  
  /** Overall prosody score (0.0 to 1.0) */
  overallScore: number;
}

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * Microphone permission status
 */
export interface MicrophonePermissionStatus {
  /** Permission status */
  status: 'granted' | 'denied' | 'undetermined' | 'limited';
  
  /** Whether permission can be requested again */
  canAskAgain: boolean;
  
  /** Reason for denial if applicable */
  reason?: 'user_denied' | 'device_restricted' | 'parental_controls' | 'permanently_denied';
  
  /** Educational explanation for microphone usage */
  usageExplanation: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total cached models count */
  totalModels: number;
  
  /** Cached models by language */
  modelsByLanguage: Record<string, number>;
  
  /** Total cache size in bytes */
  totalSizeBytes: number;
  
  /** Available cache space in bytes */
  availableSpaceBytes: number;
  
  /** Oldest cached model timestamp */
  oldestCacheTimestamp?: Date;
  
  /** Newest cached model timestamp */
  newestCacheTimestamp?: Date;
}

/**
 * Audio processing error types
 */
export interface AudioError {
  /** Error code */
  code: AudioErrorCode;
  
  /** Error message */
  message: string;
  
  /** Session identifier if applicable */
  sessionId?: string;
  
  /** Recovery suggestion */
  recoverySuggestion?: string;
}

/**
 * Audio error codes
 */
export type AudioErrorCode =
  | 'permission_denied'
  | 'recording_failed'
  | 'analysis_failed'
  | 'cache_full'
  | 'model_not_found'
  | 'invalid_audio_format'
  | 'network_unavailable'
  | 'insufficient_storage'
  | 'device_not_supported';

/**
 * Pronunciation feedback level
 */
export type FeedbackLevel = 
  | 'beginner'    // Simplified feedback for beginners
  | 'intermediate' // Detailed feedback with explanations
  | 'advanced'    // Technical feedback for advanced learners
  | 'expert';     // Professional-level feedback

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Audio pipeline configuration
 */
export interface AudioPipelineConfig {
  /** Default audio configuration */
  defaultAudioConfig: AudioConfig;
  
  /** Waveform visualization configuration */
  waveformConfig: WaveformConfig;
  
  /** Pronunciation scoring configuration */
  scoringConfig: ScoringConfig;
  
  /** Cache configuration */
  cacheConfig: CacheConfig;
  
  /** Error handling configuration */
  errorConfig: ErrorConfig;
}

/**
 * Waveform visualization configuration
 */
export interface WaveformConfig {
  /** Update frequency in FPS (default: 30) */
  fps: number;
  
  /** Number of data points per second */
  pointsPerSecond: number;
  
  /** Color scheme for visualization */
  colors: {
    waveform: string;
    speechActivity: string;
    background: string;
  };
  
  /** Whether to show spectrogram */
  showSpectrogram: boolean;
}

/**
 * Pronunciation scoring configuration
 */
export interface ScoringConfig {
  /** Minimum confidence threshold for valid score */
  minConfidenceThreshold: number;
  
  /** Accuracy weight in overall score calculation */
  accuracyWeight: number;
  
  /** Timing weight in overall score calculation */
  timingWeight: number;
  
  /** Prosody weight in overall score calculation */
  prosodyWeight: number;
  
  /** Feedback level for different user proficiency */
  feedbackLevel: FeedbackLevel;
  
  /** Whether to provide detailed phoneme-level feedback */
  detailedPhonemeFeedback: boolean;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Maximum number of cached models */
  maxCachedModels: number;
  
  /** Maximum cache size in bytes */
  maxCacheSizeBytes: number;
  
  /** Default cache eviction policy */
  evictionPolicy: 'lru' | 'fifo' | 'frequency';
  
  /** Whether to preload frequently used models */
  preloadEnabled: boolean;
  
  /** Models to preload on app start */
  preloadModels: string[];
}

/**
 * Error handling configuration
 */
export interface ErrorConfig {
  /** Maximum retry attempts for recording */
  maxRecordingRetries: number;
  
  /** Maximum retry attempts for analysis */
  maxAnalysisRetries: number;
  
  /** Whether to show detailed error messages to users */
  showDetailedErrors: boolean;
  
  /** Fallback behavior when AI service is unavailable */
  aiFallbackBehavior: 'rule_based' | 'skip' | 'cached_only';
  
  /** Graceful degradation strategy */
  degradationStrategy: 'disable_feature' | 'reduce_quality' | 'offline_only';
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Audio pipeline events
 */
export interface AudioPipelineEvents {
  /** Recording started */
  'recordingStarted': { sessionId: string; config: AudioConfig };
  
  /** Recording stopped */
  'recordingStopped': { sessionId: string; durationMs: number; audioBuffer: AudioBuffer };
  
  /** Waveform data updated */
  'waveformUpdated': { sessionId: string; data: WaveformData[] };
  
  /** Pronunciation analysis completed */
  'analysisCompleted': { sessionId: string; score: PronunciationScore };
  
  /** Model cached */
  'modelCached': { modelId: string; language: string };
  
  /** Model removed from cache */
  'modelRemoved': { modelId: string; reason: 'manual' | 'eviction' | 'expired' };
  
  /** Error occurred */
  'error': { error: AudioError; context: string };
  
  /** Permission status changed */
  'permissionChanged': { status: MicrophonePermissionStatus };
}

/**
 * Audio pipeline event listener
 */
export type AudioPipelineEventListener<K extends keyof AudioPipelineEvents> = 
  (event: AudioPipelineEvents[K]) => void;

// ============================================================================
// Factory and Utility Types
// ============================================================================

/**
 * Audio pipeline factory function type
 */
export type AudioPipelineFactory = (config?: Partial<AudioPipelineConfig>) => AudioPipeline;

/**
 * Default audio configuration (44.1kHz, 16-bit, mono)
 * Based on Requirement 3.1: 44.1kHz sample rate and 16-bit depth
 */
export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 44100,
  bitDepth: 16,
  channels: 1,
  format: 'linearPCM',
  enableWaveform: true,
  waveformFPS: 30
};

/**
 * Default pronunciation scoring configuration
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  minConfidenceThreshold: 0.7,
  accuracyWeight: 0.6,
  timingWeight: 0.2,
  prosodyWeight: 0.2,
  feedbackLevel: 'intermediate',
  detailedPhonemeFeedback: true
};

/**
 * Default cache configuration
 * Based on Requirement 3.5: Minimum 50 cached audio models
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxCachedModels: 50,
  maxCacheSizeBytes: 100 * 1024 * 1024, // 100MB
  evictionPolicy: 'lru',
  preloadEnabled: true,
  preloadModels: []
};

// ============================================================================
// Type Guards and Validation
// ============================================================================

/**
 * Check if audio configuration is valid
 */
export function isValidAudioConfig(config: unknown): config is AudioConfig {
  if (typeof config !== 'object' || config === null) return false;
  
  const c = config as Partial<AudioConfig>;
  
  return (
    typeof c.sampleRate === 'number' &&
    [44100, 48000, 16000, 8000].includes(c.sampleRate) &&
    typeof c.bitDepth === 'number' &&
    [8, 16, 24, 32].includes(c.bitDepth) &&
    typeof c.channels === 'number' &&
    [1, 2].includes(c.channels) &&
    typeof c.format === 'string' &&
    ['linearPCM', 'aac', 'mp3', 'opus'].includes(c.format) &&
    typeof c.enableWaveform === 'boolean'
  );
}

/**
 * Check if pronunciation score is valid
 */
export function isValidPronunciationScore(score: unknown): score is PronunciationScore {
  if (typeof score !== 'object' || score === null) return false;
  
  const s = score as Partial<PronunciationScore>;
  
  return (
    typeof s.accuracy === 'number' &&
    s.accuracy >= 0 && s.accuracy <= 100 &&
    Array.isArray(s.phoneticBreakdown) &&
    Array.isArray(s.recommendations) &&
    typeof s.confidence === 'number' &&
    s.confidence >= 0 && s.confidence <= 1 &&
    typeof s.feedback === 'string'
  );
}

/**
 * Create a default recording session
 */
export function createDefaultRecordingSession(id: string): RecordingSession {
  return {
    id,
    config: DEFAULT_AUDIO_CONFIG,
    startTime: new Date(),
    durationMs: 0,
    state: 'idle',
    metrics: {
      peakAmplitude: 0,
      averageAmplitude: 0,
      snrDb: 0,
      sampleCount: 0,
      isQualityRecording: false
    }
  };
}