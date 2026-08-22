/**
 * Progress Tracking Interfaces for Language-Learning Application
 * 
 * These interfaces define the data models and services for tracking user progress,
 * XP, streaks, and spaced repetition in a language-learning application.
 * 
 * Based on Requirements: 2.1, 2.2, 2.3 (Learning Progress Tracking)
 * Reference Design Document: production-readiness-implementation/design.md
 */

// ============================================================================
// Core Activity Types
// ============================================================================

/**
 * Type of learning activity
 */
export type LearningActivityType = 'lesson' | 'quiz' | 'pronunciation' | 'vocabulary' | 'grammar' | 'listening';

/**
 * Difficulty level of a learning activity
 * Corresponds to XP multipliers: easy=1x, medium=2x, hard=3x
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * Spaced repetition intervals in days
 * Based on design document: configurable intervals (1, 7, 30 days)
 */
export type SpacedRepetitionInterval = 1 | 7 | 30;

// ============================================================================
// Learning Activity Interface
// ============================================================================

/**
 * Represents a single learning activity completed by a user
 * 
 * Validates: Requirements 2.1, 2.2, 2.3
 */
export interface LearningActivity {
  /** Unique identifier for the activity */
  id: string;
  
  /** Type of learning activity */
  type: LearningActivityType;
  
  /** Difficulty level of the activity */
  difficulty: DifficultyLevel;
  
  /** When the activity was completed */
  completedAt: Date;
  
  /** Additional metadata about the activity */
  metadata: {
    /** Base XP value for this activity (before difficulty multiplier) */
    baseXP: number;
    
    /** Duration of the activity in minutes */
    duration: number;
    
    /** Language being learned */
    language: string;
    
    /** Lesson or module identifier */
    lessonId: string;
    
    /** Score or performance metric (0-100) */
    score?: number;
    
    /** Any additional custom data */
    [key: string]: any;
  };
}

// ============================================================================
// Progress Models
// ============================================================================

/**
 * Daily goal tracking
 */
export interface DailyGoal {
  /** Date of the goal */
  date: Date;
  
  /** Target XP for the day */
  targetXP: number;
  
  /** Actual XP earned */
  earnedXP: number;
  
  /** Whether the goal was achieved */
  achieved: boolean;
}

/**
 * Achievement earned by the user
 */
export interface Achievement {
  /** Unique identifier */
  id: string;
  
  /** Name of the achievement */
  name: string;
  
  /** Description of what the achievement represents */
  description: string;
  
  /** When the achievement was earned */
  earnedAt: Date;
  
  /** Icon or image for the achievement */
  icon: string;
  
  /** XP reward for earning this achievement */
  xpReward: number;
}

/**
 * Item in spaced repetition schedule
 */
export interface SpacedRepetitionItem {
  /** Unique identifier for the learning item */
  itemId: string;
  
  /** Next review date */
  nextReview: Date;
  
  /** Current interval in days */
  interval: number;
  
  /** Ease factor (adjusts interval based on performance) */
  easeFactor: number;
  
  /** Number of times reviewed */
  repetitions: number;
  
  /** Last performance score (0-100) */
  lastPerformance?: number;
  
  /** Type of content being reviewed */
  contentType: 'vocabulary' | 'grammar' | 'phrase';
}

/**
 * Progress data for a user
 */
export interface Progress {
  /** Unique identifier */
  id: string;
  
  /** User ID this progress belongs to */
  userId: string;
  
  /** Total XP earned */
  totalXP: number;
  
  /** Current streak (consecutive days with activity) */
  currentStreak: number;
  
  /** Longest streak achieved */
  longestStreak: number;
  
  /** Date of last learning activity */
  lastActivity: Date;
  
  /** Daily goals */
  dailyGoals: DailyGoal[];
  
  /** Achievements earned */
  achievements: Achievement[];
  
  /** Spaced repetition schedule */
  spacedRepetitionSchedule: SpacedRepetitionItem[];
  
  /** When this progress record was created */
  createdAt: Date;
  
  /** When this progress record was last updated */
  updatedAt: Date;
}

// ============================================================================
// Progress Tracking Service Interface
// ============================================================================

/**
 * Result of recording a learning activity
 */
export interface ProgressUpdate {
  /** Updated total XP */
  totalXP: number;
  
  /** Updated streak count */
  currentStreak: number;
  
  /** XP earned from this activity */
  xpEarned: number;
  
  /** Whether the streak was maintained */
  streakMaintained: boolean;
  
  /** Any achievements unlocked */
  unlockedAchievements: Achievement[];
  
  /** Next spaced repetition items scheduled */
  scheduledReviews: SpacedRepetitionItem[];
}

/**
 * Spaced repetition schedule
 */
export interface Schedule {
  /** Scheduled review items */
  items: SpacedRepetitionItem[];
  
  /** Next review date */
  nextReview: Date;
  
  /** Number of items due for review */
  itemsDue: number;
}

/**
 * Result of synchronization operation
 */
export interface SyncResult {
  /** Number of records synchronized */
  syncedRecords: number;
  
  /** Number of conflicts resolved */
  conflictsResolved: number;
  
  /** Duration of sync in milliseconds */
  duration: number;
  
  /** Whether sync was successful */
  success: boolean;
  
  /** Error message if sync failed */
  error?: string;
}

/**
 * Progress Tracker Service Interface
 * 
 * Main service for tracking learning progress, XP, streaks, and spaced repetition
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export interface ProgressTracker {
  /**
   * Record a learning activity and update progress
   * 
   * @param activity The learning activity to record
   * @returns Progress update with XP, streak changes, and achievements
   */
  recordActivity(activity: LearningActivity): Promise<ProgressUpdate>;
  
  /**
   * Get the current streak for a user
   * 
   * @param userId User ID to get streak for
   * @returns Current streak count (consecutive days with activity)
   */
  getStreak(userId: string): Promise<number>;
  
  /**
   * Get total XP for a user
   * 
   * @param userId User ID to get XP for
   * @returns Total XP earned
   */
  getXP(userId: string): Promise<number>;
  
  /**
   * Schedule a review for a learning item using spaced repetition
   * 
   * @param itemId ID of the learning item
   * @param intervals Array of interval days (e.g., [1, 7, 30])
   * @returns Scheduled review information
   */
  scheduleReview(itemId: string, intervals: SpacedRepetitionInterval[]): Promise<Schedule>;
  
  /**
   * Synchronize progress data with remote server
   * 
   * @returns Result of synchronization operation
   */
  syncProgress(): Promise<SyncResult>;
  
  /**
   * Get full progress data for a user
   * 
   * @param userId User ID to get progress for
   * @returns Complete progress data including XP, streaks, and schedule
   */
  getProgress(userId: string): Promise<Progress>;
  
  /**
   * Reset progress for a user (for testing or account reset)
   * 
   * @param userId User ID to reset progress for
   * @returns Whether reset was successful
   */
  resetProgress(userId: string): Promise<boolean>;
  
  /**
   * Calculate XP for an activity based on difficulty
   * 
   * @param baseXP Base XP value
   * @param difficulty Difficulty level
   * @returns XP after applying difficulty multiplier
   */
  calculateXP(baseXP: number, difficulty: DifficultyLevel): number;
  
  /**
   * Check if streak should be maintained based on activity timing
   * 
   * @param lastActivity Date of last activity
   * @param currentActivity Date of current activity
   * @returns Whether streak should be maintained
   */
  shouldMaintainStreak(lastActivity: Date, currentActivity: Date): boolean;
}

// ============================================================================
// Utility Functions and Constants
// ============================================================================

/**
 * XP multipliers based on difficulty level
 * easy=1x, medium=2x, hard=3x as per Requirements 2.1
 */
export const DIFFICULTY_MULTIPLIERS: Record<DifficultyLevel, number> = {
  easy: 1,
  medium: 2,
  hard: 3
};

/**
 * Default spaced repetition intervals in days
 */
export const DEFAULT_SPACED_REPETITION_INTERVALS: SpacedRepetitionInterval[] = [1, 7, 30];

/**
 * Maximum streak reset period in hours (24 hours = 1 day)
 */
export const STREAK_RESET_HOURS = 24;

/**
 * Calculate XP for an activity
 * 
 * @param baseXP Base XP value
 * @param difficulty Difficulty level
 * @returns XP after applying difficulty multiplier
 */
export function calculateActivityXP(baseXP: number, difficulty: DifficultyLevel): number {
  return baseXP * DIFFICULTY_MULTIPLIERS[difficulty];
}

/**
 * Check if a streak should be maintained
 * 
 * @param lastActivity Date of last activity
 * @param currentActivity Date of current activity
 * @returns Whether streak should be maintained (activities within 24 hours)
 */
export function shouldMaintainStreak(lastActivity: Date, currentActivity: Date): boolean {
  // Current activity must be after last activity for streak to continue
  if (currentActivity.getTime() <= lastActivity.getTime()) {
    return false;
  }
  
  const hoursBetween = (currentActivity.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
  return hoursBetween <= STREAK_RESET_HOURS;
}

/**
 * Calculate next spaced repetition interval
 * 
 * @param currentInterval Current interval in days
 * @param easeFactor Ease factor (typically 1.3-2.5)
 * @param performanceScore Performance score (0-100)
 * @returns Next interval in days
 */
export function calculateNextInterval(
  currentInterval: number,
  easeFactor: number,
  performanceScore: number
): number {
  // Base SM-2 algorithm inspired calculation
  if (performanceScore >= 90) {
    // Excellent performance: increase interval significantly
    return Math.floor(currentInterval * easeFactor * 1.5);
  } else if (performanceScore >= 60) {
    // Good performance: increase interval
    return Math.floor(currentInterval * easeFactor);
  } else if (performanceScore >= 30) {
    // Poor performance: reset to shorter interval
    return Math.max(1, Math.floor(currentInterval / 2));
  } else {
    // Very poor performance: reset to minimum interval
    return 1;
  }
}