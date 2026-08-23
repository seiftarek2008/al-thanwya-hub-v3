import { SpacedRepetitionItem, SpacedRepetitionMilestone } from '../types';

/**
 * Automatically creates Spaced Repetition tracking (Memory Timeline) for newly completed lessons.
 * Generates 9 lifelong review milestones stored in Firestore.
 */
export function autoCreateSpacedRepetitionReviews(
  curriculumProgress: any,
  currentReviews: SpacedRepetitionItem[],
  subjects: any[]
): SpacedRepetitionItem[] | null {
  if (!curriculumProgress) return null;

  let updated = false;
  const newReviews = [...currentReviews];

  Object.keys(curriculumProgress).forEach((lessonId) => {
    const progress = curriculumProgress[lessonId];
    if (progress && (
      (progress.stages && progress.stages[1] && progress.stages[1].status === 'completed') ||
      progress.status === 'completed' ||
      progress.status === 'done'
    )) {
      const exists = currentReviews.some((r) => r.lessonId === lessonId);
      if (!exists) {
        // Find lesson, unit, and subject details from subjects list
        let foundLesson: any = null;
        let foundUnitName = "الوحدة العامة";
        let foundSubjectName = "مادة دراسية";
        let foundSubjectId = "";

        for (const sub of subjects) {
          if (sub.units) {
            for (const unit of sub.units) {
              if (unit.lessons) {
                const les = unit.lessons.find((l: any) => l.id === lessonId);
                if (les) {
                  foundLesson = les;
                  foundUnitName = unit.name;
                  foundSubjectName = sub.name;
                  foundSubjectId = sub.id;
                  break;
                }
              }
            }
          }
          if (foundLesson) break;
        }

        const lessonName = foundLesson ? foundLesson.name : "درس جديد";
        const baseDate = new Date();
        
        // Define intervals for the 9 milestones (8 standard reviews + 1 Yearly Refresh)
        const intervals = [1, 3, 7, 14, 30, 60, 90, 180, 365];
        
        // Map lesson confidence score (out of 5) to difficulty
        const lessonConfidence = progress.confidenceScore || 4;
        const initialDifficulty: 'easy' | 'medium' | 'hard' = 
          lessonConfidence >= 5 ? 'easy' : lessonConfidence >= 3 ? 'medium' : 'hard';

        const milestones: SpacedRepetitionMilestone[] = intervals.map((days, index) => {
          const targetDate = new Date();
          targetDate.setDate(baseDate.getDate() + days);
          const dateStr = targetDate.toISOString().split('T')[0];
          
          // Ebbinghaus Forgetting Curve mathematical modeling: S (stability) grows with milestones
          const stability = 5 * Math.pow(1.6, index);
          const retentionEstimate = Math.round(Math.exp(-days / stability) * 100);
          const memoryStrength = Math.round(Math.max(15, 100 - (days / (index + 1)) * 2.5));

          return {
            daysFromStart: days,
            targetDate: dateStr,
            status: 'pending' as const,
            lessonId,
            subject: foundSubjectName,
            unit: foundUnitName,
            reviewNumber: index + 1,
            plannedReviewDate: dateStr,
            memoryStrength: Math.min(100, Math.max(10, memoryStrength)),
            retentionEstimate: Math.min(100, Math.max(5, retentionEstimate)),
            priority: 'medium' as const,
            difficulty: initialDifficulty,
            confidence: null
          };
        });

        const nextReviewDate = new Date();
        nextReviewDate.setDate(baseDate.getDate() + 1); // First review is tomorrow

        const newItem: SpacedRepetitionItem = {
          id: 'sr_' + Math.random().toString(36).substring(2, 9),
          lessonId,
          lessonName,
          subjectId: foundSubjectId,
          subjectName: foundSubjectName,
          unitName: foundUnitName,
          intervalDays: 1,
          easeFactor: 2.5,
          repetitions: 0,
          nextReviewDate: nextReviewDate.toISOString().split('T')[0],
          history: [],
          milestones,
          priority: 'medium',
          memoryStrength: 100,
          retentionEstimate: 100,
          difficulty: initialDifficulty
        };

        newReviews.push(newItem);
        updated = true;
      }
    }
  });

  return updated ? newReviews : null;
}

/**
 * Process a completed review milestone using the SM-2 algorithm and Ebbinghaus modeling.
 * Evaluates the rating and dynamically shifts/updates future milestones.
 */
export function completeReviewMilestone(
  item: SpacedRepetitionItem,
  confidence: number,
  todayStr: string
): SpacedRepetitionItem {
  const newItem = { ...item };
  const q = Math.max(1, Math.min(5, confidence));

  // 1. Record in history (Retrieval Practice & Active Recall tracking)
  newItem.history = [
    ...newItem.history,
    {
      reviewDate: todayStr,
      confidenceScore: q,
      adjustedInterval: newItem.intervalDays
    }
  ];

  // 2. SM-2 calculation
  let newRepetitions = newItem.repetitions;
  let newEaseFactor = newItem.easeFactor;
  let newInterval = newItem.intervalDays;

  if (q >= 3) {
    // Success - extend intervals
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 3;
    } else if (newRepetitions === 2) {
      newInterval = 7;
    } else {
      newInterval = Math.round(newInterval * newEaseFactor);
    }
    newRepetitions++;
    newEaseFactor = newEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  } else {
    // Failed recall - reset repetitions and decrease interval
    newRepetitions = 0;
    newInterval = 1;
    newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
  }

  newItem.repetitions = newRepetitions;
  newItem.easeFactor = Math.max(1.3, Number(newEaseFactor.toFixed(3)));
  newItem.intervalDays = Math.min(365, newInterval);

  const nextDate = new Date(todayStr);
  nextDate.setDate(nextDate.getDate() + newItem.intervalDays);
  newItem.nextReviewDate = nextDate.toISOString().split('T')[0];

  // Calculate current overall lesson memory status
  const finalMemoryStrength = Math.round(Math.min(100, Math.max(10, 30 + q * 12 + newRepetitions * 5)));
  newItem.memoryStrength = finalMemoryStrength;
  newItem.retentionEstimate = q >= 3 ? 95 : 35; // high retrieval strength upon successful recall
  newItem.difficulty = q >= 4 ? 'easy' : q === 3 ? 'medium' : 'hard';

  // 3. Update the active milestone and dynamically adjust remaining review intervals
  let activeMilestoneFound = false;

  newItem.milestones = newItem.milestones.map((milestone) => {
    if (milestone.status === 'pending' && !activeMilestoneFound) {
      activeMilestoneFound = true;
      // Complete current milestone
      return {
        ...milestone,
        status: 'completed' as const,
        completedAt: todayStr,
        confidence: q,
        memoryStrength: finalMemoryStrength,
        retentionEstimate: 100,
        difficulty: q >= 4 ? 'easy' as const : q === 3 ? 'medium' : 'hard' as const
      };
    }

    if (milestone.status === 'pending' && activeMilestoneFound) {
      // DYNAMIC INTERVAL SHIFTING: Adjust future review dates
      // If student has high retention (q >= 4), we extend the intervals (shift further).
      // If student forgot (q < 3), we shorten the intervals to repeat sooner.
      const multiplier = q >= 4 ? 1.25 : q < 3 ? 0.7 : 1.0;
      
      const currentPlannedDate = new Date(milestone.plannedReviewDate);
      const daysDiff = Math.max(1, Math.round((currentPlannedDate.getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)));
      const adjustedDays = Math.max(1, Math.round(daysDiff * multiplier));
      
      const newPlannedDate = new Date(todayStr);
      newPlannedDate.setDate(newPlannedDate.getDate() + adjustedDays);
      const newPlannedDateStr = newPlannedDate.toISOString().split('T')[0];

      // Recalculate estimated decaying retention for adjusted milestone
      const stability = 5 * Math.pow(1.6, milestone.reviewNumber - 1) * (q >= 4 ? 1.3 : 0.8);
      const estimatedRetention = Math.round(Math.exp(-adjustedDays / stability) * 100);
      const estimatedMemoryStrength = Math.round(Math.max(15, 100 - (adjustedDays / milestone.reviewNumber) * 2));

      return {
        ...milestone,
        plannedReviewDate: newPlannedDateStr,
        targetDate: newPlannedDateStr,
        retentionEstimate: Math.min(100, Math.max(5, estimatedRetention)),
        memoryStrength: Math.min(100, Math.max(10, estimatedMemoryStrength))
      };
    }

    return milestone;
  });

  // Fallback: If no pending milestone was found, complete the first one
  if (!activeMilestoneFound) {
    let completedFirst = false;
    newItem.milestones = newItem.milestones.map((m) => {
      if (!completedFirst) {
        completedFirst = true;
        return {
          ...m,
          status: 'completed' as const,
          completedAt: todayStr,
          confidence: q,
          memoryStrength: finalMemoryStrength,
          retentionEstimate: 100
        };
      }
      return m;
    });
  }

  // Adjust overall priority
  newItem.priority = q < 3 ? 'high' : q === 3 ? 'medium' : 'low';

  return newItem;
}

/**
 * Scans all reviews and reschedules missed ones intelligently to prevent review overload.
 * Automatically recalibrates memory retention and elevates review priority.
 */
export function rescheduleMissedReviews(
  reviews: SpacedRepetitionItem[],
  todayStr: string
): { updatedReviews: SpacedRepetitionItem[]; explanations: string[] } {
  const explanations: string[] = [];
  const todayTime = new Date(todayStr).getTime();

  const updatedReviews = reviews.map((item) => {
    const nextReviewTime = new Date(item.nextReviewDate).getTime();
    if (nextReviewTime < todayTime) {
      // It is missed!
      const missedDays = Math.floor((todayTime - nextReviewTime) / (1000 * 60 * 60 * 24));
      
      // Reschedule nextReviewDate to today or tomorrow to stagger cognitive load
      const newNextDate = new Date(todayStr);
      const stagger = Math.floor(Math.random() * 2); // 0 or 1 day stagger
      newNextDate.setDate(newNextDate.getDate() + stagger);
      const staggeredDateStr = newNextDate.toISOString().split('T')[0];

      // Decrease current retention dynamically because they missed the review
      const currentRetention = item.retentionEstimate || 80;
      const decayMultiplier = Math.max(0.3, Math.exp(-missedDays / 10));
      const newRetentionEstimate = Math.round(currentRetention * decayMultiplier);
      const newMemoryStrength = Math.round(Math.max(10, (item.memoryStrength || 80) - missedDays * 2.5));

      // Mark the milestone that was missed as missed, and reschedule future planned reviews
      const updatedMilestones = item.milestones.map((milestone) => {
        if (milestone.status === 'pending' && milestone.targetDate < todayStr) {
          return {
            ...milestone,
            status: 'missed' as const,
            rescheduledReason: `تأجيل ذكي لتجنب تراكم العبء المعرفي بعد تأخير ${missedDays} أيام.`,
            retentionEstimate: newRetentionEstimate,
            memoryStrength: newMemoryStrength
          };
        }
        return milestone;
      });

      explanations.push(
        `تمت إعادة جدولة مراجعة درس **${item.lessonName}** (${item.subjectName}) ذكياً إلى ${
          stagger === 0 ? 'اليوم' : 'الغد'
        } لتجنب تراكم المواد وتفادي الإرهاق العقلي.`
      );

      return {
        ...item,
        nextReviewDate: staggeredDateStr,
        milestones: updatedMilestones,
        priority: 'high' as const, // High priority because it was missed!
        retentionEstimate: newRetentionEstimate,
        memoryStrength: newMemoryStrength
      };
    }
    return item;
  });

  return { updatedReviews, explanations };
}
