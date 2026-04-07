// ===== Config =====
export interface PriorityCategory {
  id: string;
  name: string;
  description?: string;
  scoreP: number;
  sortOrder: number;
  isActive: boolean;
}

export interface ScoreConfig {
  id: string;
  timeCoefficient: number;
  skipScores: number[];
  autoSkipScores: number[];
}

// ===== Rooms =====
export interface DoctorSlot {
  id: string;
  roomId: string;
  slotNumber: number;
  doctorName?: string;
  isAbsent: boolean;
}

export interface ClinicRoom {
  id: string;
  name: string;
  description?: string;
  type: 'examination' | 'result';
  isActive: boolean;
  slots: DoctorSlot[];
}

// ===== Patients =====
export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  idCard?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

// ===== Visits =====
export interface Visit {
  id: string;
  visitCode: string;
  patient: Patient;
  categoryIds: string[];
  categories: PriorityCategory[]; // populated by BE
  room?: ClinicRoom;
  roomId?: string;
  appointmentTime?: string;
  checkInType?: 'new' | 'result';
  checkInAt?: string;
  visitDate: string;
  createdAt: string;
}

// ===== Queue =====
export interface ScoreBreakdown {
  scoreP: number;
  scoreT: number;
  scoreS: number;
  scoreF: number;
  total: number;
  waitingMinutes: number;
}

export type QueueStatus = 'waiting' | 'in_room' | 'done' | 'skipped';

export interface QueueEntry {
  id: string;
  visitId: string;
  visit: Visit;
  slot?: DoctorSlot;
  slotId?: string;
  status: QueueStatus;
  scoreP: number;
  scoreT: number;
  scoreS: number;
  scoreC: number;
  scoreF: number;
  totalScore: number;
  skipCount: number;
  autoSkipCount: number;
  currentRank?: number;
  queuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  examinationMinutes?: number | null;
  scoreBreakdown?: ScoreBreakdown;
}
