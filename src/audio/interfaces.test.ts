/**
 * Audio Interfaces Tests
 * 
 * Tests for audio processing interfaces to ensure they compile correctly
 * and meet the requirements specification.
 * 
 * Feature: production-readiness-implementation
 * Requirements: 3.1, 3.3, 3.4 (Audio Pronunciation Pipeline)
 */

import { describe, test, expect } from 'vitest';
import {
  // Core interfaces
  AudioPipeline,
  PronunciationScore,
  
  // Configuration types
  AudioConfig,
  DEFAULT_AUDIO_CONFIG,
  
  // Data types
  RecordingSession,
  AudioBuffer,
  PronunciationModel,
  PhoneticSegment,
  WaveformData,
  
  // Utility functions
  isValidAudioConfig,
  isValidPronunciationScore,
  createDefaultRecordingSession,
  
  // Constants
  DEFAULT_SCORING_CONFIG,
  DEFAULT_CACHE_CONFIG
} from './interfaces';

/**
 * Test suite for audio processing interfaces
 */
describe('Audio Processing Interfaces', () => {
  
  describe('AudioConfig interface', () => {
    test('should have required properties based on Requirement 3.1', () => {
      const config: AudioConfig = {
        sampleRate: 44100,
        bitDepth: 16,
        channels: 1,
        format: 'linearPCM',
        enableWaveform: true,
        waveformFPS: 30
      };
      
      expect(config.sampleRate).toBe(44100); // 44.1kHz
      expect(config.bitDepth).toBe(16); // 16-bit depth
      expect(config.enableWaveform).toBe(true);
      expect(config.waveformFPS).toBe(30); // 30 FPS from Requirement 3.2
    });
    
    test('DEFAULT_AUDIO_CONFIG should match Requirement 3.1 specifications', () => {
      expect(DEFAULT_AUDIO_CONFIG.sampleRate).toBe(44100);
      expect(DEFAULT_AUDIO_CONFIG.bitDepth).toBe(16);
      expect(DEFAULT_AUDIO_CONFIG.enableWaveform).toBe(true);
      expect(DEFAULT_AUDIO_CONFIG.waveformFPS).toBe(30);
    });
  });
  
  describe('PronunciationScore interface', () => {
    test('should have required properties based on Design Document', () => {
      const score: PronunciationScore = {
        accuracy: 85.5,
        phoneticBreakdown: [],
        recommendations: ['Try to pronounce the "r" sound more clearly'],
        confidence: 0.92,
        feedback: 'Good pronunciation with minor improvements needed',
        phonemeScores: [
          {
            phoneme: 'r',
            accuracy: 0.7,
            confidence: 0.8,
            errorType: 'distortion',
            suggestedCorrection: 'Roll your tongue slightly'
          }
        ],
        timingAnalysis: {
          speakingRateWpm: 120,
          averagePauseDurationMs: 250,
          pauseCount: 2,
          rhythmConsistency: 0.8,
          isWithinExpectedRange: true
        },
        prosodyAnalysis: {
          pitchVariation: 0.75,
          stressAccuracy: 0.9,
          intonationAccuracy: 0.85,
          overallScore: 0.83
        }
      };
      
      expect(score.accuracy).toBeGreaterThanOrEqual(0);
      expect(score.accuracy).toBeLessThanOrEqual(100);
      expect(score.confidence).toBeGreaterThanOrEqual(0);
      expect(score.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(score.recommendations)).toBe(true);
      expect(Array.isArray(score.phoneticBreakdown)).toBe(true);
    });
    
    test('should meet Requirement 3.4: Display feedback containing accuracy percentage, phonetic breakdown, and recommendations', () => {
      const score: PronunciationScore = {
        accuracy: 92.5,
        phoneticBreakdown: [
          {
            id: 'ph1',
            phoneme: 'θ',
            startTimeMs: 100,
            endTimeMs: 200,
            expectedDurationMs: 150
          }
        ],
        recommendations: ['Place tongue between teeth for "th" sound'],
        confidence: 0.95,
        feedback: 'Excellent pronunciation',
        phonemeScores: [],
        timingAnalysis: {
          speakingRateWpm: 110,
          averagePauseDurationMs: 200,
          pauseCount: 1,
          rhythmConsistency: 0.9,
          isWithinExpectedRange: true
        },
        prosodyAnalysis: {
          pitchVariation: 0.8,
          stressAccuracy: 0.95,
          intonationAccuracy: 0.9,
          overallScore: 0.88
        }
      };
      
      // Requirement 3.4 verification
      expect(typeof score.accuracy).toBe('number'); // Accuracy percentage
      expect(Array.isArray(score.phoneticBreakdown)).toBe(true); // Phonetic breakdown
      expect(Array.isArray(score.recommendations)).toBe(true); // Improvement recommendations
    });
  });
  
  describe('AudioPipeline interface', () => {
    test('should define required methods based on Design Document', () => {
      // This is a type test - we're checking that the interface has the expected methods
      const pipeline: AudioPipeline = {
        startRecording: async (config: AudioConfig) => {
          return {
            id: 'test-session',
            config,
            startTime: new Date(),
            durationMs: 0,
            state: 'recording',
            metrics: {
              peakAmplitude: 0,
              averageAmplitude: 0,
              snrDb: 0,
              sampleCount: 0,
              isQualityRecording: false
            }
          };
        },
        
        stopRecording: async (sessionId: string) => {
          return {
            samples: new Float32Array(44100), // 1 second of audio at 44.1kHz
            sampleRate: 44100,
            bitDepth: 16,
            channels: 1,
            duration: 1.0,
            format: 'float32' as const
          };
        },
        
        analyzePronunciation: async (audio: AudioBuffer, reference: PronunciationModel) => {
          return {
            accuracy: 75.0,
            phoneticBreakdown: [],
            recommendations: [],
            confidence: 0.8,
            feedback: 'Test feedback',
            phonemeScores: [],
            timingAnalysis: {
              speakingRateWpm: 100,
              averagePauseDurationMs: 300,
              pauseCount: 3,
              rhythmConsistency: 0.7,
              isWithinExpectedRange: true
            },
            prosodyAnalysis: {
              pitchVariation: 0.6,
              stressAccuracy: 0.8,
              intonationAccuracy: 0.7,
              overallScore: 0.7
            }
          };
        },
        
        getWaveformData: async (sessionId: string) => {
          return [
            {
              timestampMs: 0,
              amplitude: 0.5,
              hasSpeech: true,
              speechConfidence: 0.9
            }
          ];
        },
        
        cacheModel: async (model: PronunciationModel) => {
          // Implementation would cache the model
        },
        
        checkMicrophonePermission: async () => {
          return {
            status: 'granted',
            canAskAgain: true,
            usageExplanation: 'Microphone is used for pronunciation practice'
          };
        },
        
        requestMicrophonePermission: async () => {
          return {
            status: 'granted',
            canAskAgain: true,
            usageExplanation: 'Microphone is used for pronunciation practice'
          };
        },
        
        getCachedModels: async () => {
          return ['model-1', 'model-2'];
        },
        
        removeCachedModel: async (modelId: string) => {
          // Implementation would remove the model
        },
        
        getCacheStats: async () => {
          return {
            totalModels: 2,
            modelsByLanguage: { en: 2 },
            totalSizeBytes: 1024 * 1024, // 1MB
            availableSpaceBytes: 100 * 1024 * 1024 // 100MB
          };
        }
      };
      
      // Verify the interface methods exist
      expect(typeof pipeline.startRecording).toBe('function');
      expect(typeof pipeline.stopRecording).toBe('function');
      expect(typeof pipeline.analyzePronunciation).toBe('function');
      expect(typeof pipeline.getWaveformData).toBe('function');
      expect(typeof pipeline.cacheModel).toBe('function');
      
      // Verify Requirement 3.5: Support offline pronunciation practice
      expect(typeof pipeline.getCachedModels).toBe('function');
      expect(typeof pipeline.cacheModel).toBe('function');
    });
  });
  
  describe('PronunciationModel interface', () => {
    test('should support offline caching based on Requirement 3.5', () => {
      const model: PronunciationModel = {
        id: 'en-hello-001',
        language: 'en',
        text: 'Hello',
        phoneticTranscription: 'həˈloʊ',
        segments: [
          {
            id: 'seg1',
            phoneme: 'h',
            startTimeMs: 0,
            endTimeMs: 50,
            expectedDurationMs: 50
          },
          {
            id: 'seg2',
            phoneme: 'ə',
            startTimeMs: 50,
            endTimeMs: 100,
            expectedDurationMs: 50,
            stress: 'secondary'
          },
          {
            id: 'seg3',
            phoneme: 'l',
            startTimeMs: 100,
            endTimeMs: 150,
            expectedDurationMs: 50
          },
          {
            id: 'seg4',
            phoneme: 'oʊ',
            startTimeMs: 150,
            endTimeMs: 250,
            expectedDurationMs: 100,
            stress: 'primary'
          }
        ],
        metadata: {
          version: '1.0.0',
          confidenceThreshold: 0.7,
          isCached: true,
          cachedAt: new Date('2024-01-01'),
          sizeBytes: 1024 * 50 // 50KB
        }
      };
      
      expect(model.metadata.isCached).toBe(true);
      expect(model.metadata.cachedAt).toBeInstanceOf(Date);
      expect(typeof model.metadata.sizeBytes).toBe('number');
    });
  });
  
  describe('Utility functions', () => {
    test('isValidAudioConfig should validate configurations', () => {
      const validConfig = {
        sampleRate: 44100,
        bitDepth: 16,
        channels: 1,
        format: 'linearPCM' as const,
        enableWaveform: true
      };
      
      const invalidConfig = {
        sampleRate: 22050, // Not in allowed values
        bitDepth: 16,
        channels: 1,
        format: 'linearPCM' as const,
        enableWaveform: true
      };
      
      expect(isValidAudioConfig(validConfig)).toBe(true);
      expect(isValidAudioConfig(invalidConfig)).toBe(false);
      expect(isValidAudioConfig(null)).toBe(false);
      expect(isValidAudioConfig(undefined)).toBe(false);
    });
    
    test('isValidPronunciationScore should validate scores', () => {
      const validScore = {
        accuracy: 85.5,
        phoneticBreakdown: [],
        recommendations: [],
        confidence: 0.9,
        feedback: 'Good',
        phonemeScores: [],
        timingAnalysis: {
          speakingRateWpm: 100,
          averagePauseDurationMs: 200,
          pauseCount: 1,
          rhythmConsistency: 0.8,
          isWithinExpectedRange: true
        },
        prosodyAnalysis: {
          pitchVariation: 0.7,
          stressAccuracy: 0.8,
          intonationAccuracy: 0.75,
          overallScore: 0.75
        }
      };
      
      const invalidScore = {
        accuracy: 150, // Invalid: > 100%
        phoneticBreakdown: [],
        recommendations: [],
        confidence: 0.9,
        feedback: 'Invalid'
      };
      
      expect(isValidPronunciationScore(validScore)).toBe(true);
      expect(isValidPronunciationScore(invalidScore)).toBe(false);
    });
    
    test('createDefaultRecordingSession should create valid session', () => {
      const session = createDefaultRecordingSession('test-id');
      
      expect(session.id).toBe('test-id');
      expect(session.config).toEqual(DEFAULT_AUDIO_CONFIG);
      expect(session.state).toBe('idle');
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.metrics).toBeDefined();
    });
  });
  
  describe('Configuration constants', () => {
    test('DEFAULT_CACHE_CONFIG should support Requirement 3.5 minimum 50 cached models', () => {
      expect(DEFAULT_CACHE_CONFIG.maxCachedModels).toBeGreaterThanOrEqual(50);
      expect(DEFAULT_CACHE_CONFIG.maxCachedModels).toBe(50);
    });
    
    test('DEFAULT_SCORING_CONFIG should have valid weights', () => {
      const totalWeight = 
        DEFAULT_SCORING_CONFIG.accuracyWeight +
        DEFAULT_SCORING_CONFIG.timingWeight +
        DEFAULT_SCORING_CONFIG.prosodyWeight;
      
      expect(totalWeight).toBeCloseTo(1.0); // Weights should sum to 1.0
      expect(DEFAULT_SCORING_CONFIG.minConfidenceThreshold).toBeGreaterThan(0);
      expect(DEFAULT_SCORING_CONFIG.minConfidenceThreshold).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Type completeness', () => {
    test('all interfaces should be properly typed', () => {
      // Test WaveformData based on Requirement 3.2
      const waveformData: WaveformData = {
        timestampMs: 1000,
        amplitude: 0.75,
        hasSpeech: true,
        speechConfidence: 0.9
      };
      
      expect(waveformData.timestampMs).toBe(1000);
      expect(waveformData.amplitude).toBeGreaterThanOrEqual(0);
      expect(waveformData.amplitude).toBeLessThanOrEqual(1);
      
      // Test PhoneticSegment
      const phoneticSegment: PhoneticSegment = {
        id: 'ph1',
        phoneme: 'æ',
        startTimeMs: 0,
        endTimeMs: 100,
        expectedDurationMs: 90,
        stress: 'primary'
      };
      
      expect(phoneticSegment.phoneme).toBe('æ');
      expect(phoneticSegment.endTimeMs).toBeGreaterThan(phoneticSegment.startTimeMs);
      
      // Test AudioBuffer
      const audioBuffer: AudioBuffer = {
        samples: new Float32Array(44100),
        sampleRate: 44100,
        bitDepth: 16,
        channels: 1,
        duration: 1.0,
        format: 'float32'
      };
      
      expect(audioBuffer.sampleRate).toBe(44100);
      expect(audioBuffer.bitDepth).toBe(16);
      expect(audioBuffer.duration).toBe(1.0);
    });
  });
});