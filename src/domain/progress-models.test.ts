/**
 * Tests for Progress Tracking Interfaces
 * 
 * Validates that the progress tracking interfaces meet the requirements
 * for the language-learning application.
 * 
 * Requirements: 2.1, 2.2, 2.3 (Learning Progress Tracking)
 */

import { describe, expect, it } from 'vitest';
import {
  // Types
  LearningActivityType,
  DifficultyLevel,
  SpacedRepetitionInterval,
  LearningActivity,
  Progress,
  ProgressTracker,
  
  // Constants
  DIFFICULTY_MULTIPLIERS,
  DEFAULT_SPACED_REPETITION_INTERVALS,
  STREAK_RESET_HOURS,
  
  // Functions
  calculateActivityXP,
  shouldMaintainStreak,
  calculateNextInterval
} from './progress-models';

describe('Progress Tracking Interfaces', () => {
  
  describe('Type Definitions', () => {
    it('should define LearningActivityType with correct values', () => {
      const validTypes: LearningActivityType[] = [
        'lesson', 'quiz', 'pronunciation', 'vocabulary', 'grammar', 'listening'
      ];
      
      // TypeScript will catch invalid values at compile time
      expect(validTypes).toHaveLength(6);
      expect(validTypes).toContain('lesson');
      expect(validTypes).toContain('pronunciation');
    });
    
    it('should define DifficultyLevel with correct values and multipliers', () => {
      const validLevels: DifficultyLevel[] = ['easy', 'medium', 'hard'];
      
      expect(validLevels).toHaveLength(3);
      expect(DIFFICULTY_MULTIPLIERS.easy).toBe(1);  // Requirement 2.1: 1x for easy
      expect(DIFFICULTY_MULTIPLIERS.medium).toBe(2); // Requirement 2.1: 2x for medium
      expect(DIFFICULTY_MULTIPLIERS.hard).toBe(3);   // Requirement 2.1: 3x for hard
    });
    
    it('should define SpacedRepetitionInterval with correct values', () => {
      const validIntervals: SpacedRepetitionInterval[] = [1, 7, 30];
      
      expect(validIntervals).toHaveLength(3);
      expect(DEFAULT_SPACED_REPETITION_INTERVALS).toEqual([1, 7, 30]); // Requirement 2.3
    });
  });
  
  describe('LearningActivity Interface', () => {
    it('should have all required properties', () => {
      const activity: LearningActivity = {
        id: 'activity-123',
        type: 'lesson',
        difficulty: 'medium',
        completedAt: new Date('2024-01-15T10:30:00Z'),
        metadata: {
          baseXP: 100,
          duration: 30,
          language: 'Spanish',
          lessonId: 'lesson-456'
        }
      };
      
      expect(activity.id).toBe('activity-123');
      expect(activity.type).toBe('lesson');
      expect(activity.difficulty).toBe('medium');
      expect(activity.completedAt).toBeInstanceOf(Date);
      expect(activity.metadata.baseXP).toBe(100);
      expect(activity.metadata.duration).toBe(30);
      expect(activity.metadata.language).toBe('Spanish');
    });
    
    it('should allow optional score in metadata', () => {
      const activityWithScore: LearningActivity = {
        id: 'activity-124',
        type: 'quiz',
        difficulty: 'hard',
        completedAt: new Date('2024-01-15T11:30:00Z'),
        metadata: {
          baseXP: 150,
          duration: 20,
          language: 'French',
          lessonId: 'quiz-789',
          score: 85
        }
      };
      
      expect(activityWithScore.metadata.score).toBe(85);
    });
  });
  
  describe('Progress Interface', () => {
    it('should have all required properties for tracking', () => {
      const progress: Progress = {
        id: 'progress-123',
        userId: 'user-456',
        totalXP: 1250,
        currentStreak: 7,
        longestStreak: 14,
        lastActivity: new Date('2024-01-15T10:30:00Z'),
        dailyGoals: [],
        achievements: [],
        spacedRepetitionSchedule: [],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
      };
      
      expect(progress.totalXP).toBe(1250);
      expect(progress.currentStreak).toBe(7);
      expect(progress.longestStreak).toBe(14);
      expect(progress.lastActivity).toBeInstanceOf(Date);
    });
  });
  
  describe('ProgressTracker Interface Structure', () => {
    it('should define all required methods', () => {
      // This test validates the interface structure at compile time
      // We're checking that the interface defines the methods specified in design
      const trackerMethods: Array<keyof ProgressTracker> = [
        'recordActivity',
        'getStreak',
        'getXP',
        'scheduleReview',
        'syncProgress',
        'getProgress',
        'resetProgress',
        'calculateXP',
        'shouldMaintainStreak'
      ];
      
      expect(trackerMethods).toHaveLength(9);
      expect(trackerMethods).toContain('recordActivity');
      expect(trackerMethods).toContain('getStreak');    // Requirement 2.2
      expect(trackerMethods).toContain('getXP');       // Requirement 2.1
      expect(trackerMethods).toContain('scheduleReview'); // Requirement 2.3
      expect(trackerMethods).toContain('syncProgress'); // Requirement 2.4
    });
  });
  
  describe('Utility Functions', () => {
    describe('calculateActivityXP', () => {
      it('should calculate XP correctly based on difficulty', () => {
        // Requirement 2.1: XP multipliers based on difficulty
        expect(calculateActivityXP(100, 'easy')).toBe(100);   // 100 * 1
        expect(calculateActivityXP(100, 'medium')).toBe(200); // 100 * 2
        expect(calculateActivityXP(100, 'hard')).toBe(300);   // 100 * 3
        
        expect(calculateActivityXP(50, 'easy')).toBe(50);
        expect(calculateActivityXP(50, 'medium')).toBe(100);
        expect(calculateActivityXP(50, 'hard')).toBe(150);
      });
    });
    
    describe('shouldMaintainStreak', () => {
      it('should maintain streak for activities within 24 hours', () => {
        // Requirement 2.2: Streak maintained if activity within 24-hour period
        const lastActivity = new Date('2024-01-15T10:00:00Z');
        
        // Same day, 2 hours later
        const currentActivity1 = new Date('2024-01-15T12:00:00Z');
        expect(shouldMaintainStreak(lastActivity, currentActivity1)).toBe(true);
        
        // Next day, 23 hours later
        const currentActivity2 = new Date('2024-01-16T09:00:00Z');
        expect(shouldMaintainStreak(lastActivity, currentActivity2)).toBe(true);
        
        // Next day, 25 hours later - streak should break
        const currentActivity3 = new Date('2024-01-16T11:00:00Z');
        expect(shouldMaintainStreak(lastActivity, currentActivity3)).toBe(false);
        
        // Check exact 24 hour boundary
        const currentActivity4 = new Date('2024-01-16T10:00:00Z');
        expect(shouldMaintainStreak(lastActivity, currentActivity4)).toBe(true);
      });
      
      it('should handle activities in different order (current before last)', () => {
        // This shouldn't happen in practice, but function should handle it
        const lastActivity = new Date('2024-01-15T10:00:00Z');
        const currentActivity = new Date('2024-01-14T10:00:00Z'); // Earlier date
        
        expect(shouldMaintainStreak(lastActivity, currentActivity)).toBe(false);
      });
    });
    
    describe('calculateNextInterval', () => {
      it('should increase interval for good performance', () => {
        // Excellent performance (>= 90): increase significantly
        expect(calculateNextInterval(7, 1.5, 95)).toBeGreaterThan(7);
        
        // Good performance (>= 60): increase normally
        expect(calculateNextInterval(7, 1.5, 75)).toBeGreaterThan(7);
        
        // Floor ensures minimum interval of 1 day
        expect(calculateNextInterval(7, 1.5, 75)).toBe(Math.floor(7 * 1.5));
      });
      
      it('should decrease interval for poor performance', () => {
        // Poor performance (>= 30): reset to shorter interval
        expect(calculateNextInterval(7, 1.5, 45)).toBeLessThan(7);
        expect(calculateNextInterval(7, 1.5, 45)).toBe(Math.floor(7 / 2));
        
        // Very poor performance (< 30): reset to minimum
        expect(calculateNextInterval(7, 1.5, 20)).toBe(1);
        expect(calculateNextInterval(30, 2.0, 10)).toBe(1);
      });
      
      it('should handle edge cases', () => {
        // Minimum interval should be 1
        expect(calculateNextInterval(1, 1.3, 90)).toBeGreaterThanOrEqual(1);
        
        // Zero or negative scores
        expect(calculateNextInterval(7, 1.5, 0)).toBe(1);
        expect(calculateNextInterval(7, 1.5, -10)).toBe(1);
      });
    });
  });
  
  describe('Constants Validation', () => {
    it('should define correct streak reset period', () => {
      // Requirement 2.2: Streak maintained within 24-hour period
      expect(STREAK_RESET_HOURS).toBe(24);
    });
    
    it('should define correct default spaced repetition intervals', () => {
      // Requirement 2.3: Configurable intervals (1, 7, 30 days)
      expect(DEFAULT_SPACED_REPETITION_INTERVALS).toEqual([1, 7, 30]);
    });
    
    it('should define correct difficulty multipliers', () => {
      // Requirement 2.1: Difficulty-based XP multipliers
      expect(DIFFICULTY_MULTIPLIERS).toEqual({
        easy: 1,
        medium: 2,
        hard: 3
      });
    });
  });
});