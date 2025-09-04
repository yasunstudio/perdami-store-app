import { BatchConfig } from '../types/batch.types';

export const BATCH_CONFIG: BatchConfig = {
  batch1: {
    id: 'batch_1',
    name: 'batch1',
    displayName: 'Batch 1 (Siang)',
    startTime: '06:00',
    endTime: '18:00',
    cutoffTime: '15:00',
    description: 'Batch siang untuk pickup 18:00-20:00'
  },
  batch2: {
    id: 'batch_2',
    name: 'batch2',
    displayName: 'Batch 2 (Malam)',
    startTime: '18:00',
    endTime: '06:00',
    cutoffTime: '03:00',
    description: 'Batch malam untuk pickup 08:00-12:00'
  }
};

export const BATCH_STATUS_CONFIG = {
  upcoming: {
    label: 'Upcoming',
    color: 'blue',
    icon: '⏰'
  },
  active: {
    label: 'Active',
    color: 'green',
    icon: '🟢'
  },
  cutoff: {
    label: 'Cut-off Reached',
    color: 'orange',
    icon: '🟡'
  },
  preparation: {
    label: 'Preparation',
    color: 'purple',
    icon: '🔄'
  },
  pickup: {
    label: 'Pickup Time',
    color: 'teal',
    icon: '📦'
  },
  completed: {
    label: 'Completed',
    color: 'gray',
    icon: '✅'
  }
};

export const TIME_ZONES = {
  WIB: 'Asia/Jakarta',
  WITA: 'Asia/Makassar',
  WIT: 'Asia/Jayapura'
};

export const DEFAULT_TIMEZONE = TIME_ZONES.WIB;
