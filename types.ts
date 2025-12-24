export interface ProcessResult {
  success: boolean;
  message: string;
  data?: Uint8Array;
  logs: string[];
  processedClasses: number;
}

export interface ScheduleConfig {
  month: number;
  year: number;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}