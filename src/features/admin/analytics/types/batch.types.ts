export interface BatchConfig {
  batch1: {
    id: string;
    name: string;
    displayName: string;
    startTime: string;
    endTime: string;
    cutoffTime: string;
    description: string;
  };
  batch2: {
    id: string;
    name: string;
    displayName: string;
    startTime: string;
    endTime: string;
    cutoffTime: string;
    description: string;
  };
}

export interface BatchStatistics {
  batchId: string;
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  peakHour: string;
  completionRate: number;
  storeParticipation: number;
  averagePreparationTime: number;
}

export interface BatchTimeSlot {
  id: string;
  batchId: string;
  startTime: string;
  endTime: string;
  orderCount: number;
  isActive: boolean;
  isPeak: boolean;
}

export type BatchStatus = 'upcoming' | 'active' | 'cutoff' | 'preparation' | 'pickup' | 'completed';

export interface BatchProgress {
  batchId: string;
  status: BatchStatus;
  timeRemaining: number;
  nextMilestone: string;
  completionPercentage: number;
}
