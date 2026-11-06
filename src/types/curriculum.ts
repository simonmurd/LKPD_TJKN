export type UserRole = 'siswa' | 'guru';

export type QuestionType = 'standard_mcq' | 'complex_mcq' | 'essay';

export interface StandardMCQ {
  id: string;
  number: number;
  question: string;
  options: {
    id: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  competency: string;
  difficulty: 'Mudah' | 'Sedang' | 'HOTS';
}

export interface ComplexMCQ {
  id: string;
  number: number;
  question: string;
  options: {
    id: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
  }[];
  correctAnswers: ('A' | 'B' | 'C' | 'D' | 'E')[];
  explanation: string;
  competency: string;
  difficulty: 'Sedang' | 'HOTS';
}

export interface EssayRubricCriterion {
  aspect: string;
  score: number;
  indicator: string;
}

export interface EssayQuestion {
  id: string;
  number: number;
  title: string;
  caseBackground: string;
  question: string;
  subQuestions?: string[];
  modelAnswer: string;
  rubric: {
    maxScore: number;
    criteria: EssayRubricCriterion[];
  };
  competency: string;
}

export interface PracticalSimulationTask {
  id: string;
  taskNumber: number;
  title: string;
  type:
    | 'crimping'
    | 'lan_tester'
    | 'wireless_spectrum'
    | 'link_budget'
    | 'fiber_splice'
    | 'otdr_analysis'
    | 'bandwidth_qos'
    | 'topology_vlan';
  objective: string;
  toolsAndMaterials: string[];
  safetyGuidelines: string[];
  stepByStepGuide: string[];
  expectedObservation: string;
  criticalAnalysisQuestion: string;
}

export interface CurriculumBab {
  id: number;
  code: string;
  title: string;
  semester: 1 | 2 | 3 | 4;
  grade: 'Kelas XI' | 'Kelas XII';
  hoursAllocation: number; // e.g., 18 JP
  capaianPembelajaran: string;
  elemen: string;
  tujuanPembelajaran: string[];
  primarySimulationType: PracticalSimulationTask['type'];
  simulations: PracticalSimulationTask[];
  standardMCQs: StandardMCQ[];
  complexMCQs: ComplexMCQ[];
  essayQuestions: EssayQuestion[];
}

export interface StudentProfile {
  id: string;
  noAbsen: string;
  name: string;
  school: string;
  className: string;
}

export interface ExamSubmission {
  id?: string;
  babId: number;
  date: string;
  studentId?: string;
  studentName?: string;
  noAbsen?: string;
  school?: string;
  className?: string;
  standardAnswers: Record<string, string>; // questionId -> 'A'..'E'
  complexAnswers: Record<string, string[]>; // questionId -> ['A', 'C']
  standardScore: number; // out of 20
  complexScore: number; // out of 20
  totalScore: number; // out of 100
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  isFlaggedTooFast?: boolean;
  tabViolations?: number;
  raguRaguCount?: number;
  status?: 'submitted' | 'cancelled_by_teacher';
  cancelledAt?: string;
  cancelReason?: string;
}

export interface EssaySubmission {
  babId: number;
  questionId: string;
  studentId?: string;
  studentName?: string;
  studentAnswer: string;
  submittedAt: string;
  aiGrading?: {
    score: number;
    letterGrade: string;
    summaryFeedback: string;
    strengths: string[];
    improvements: string[];
    idealSolution: string;
  };
  teacherScore?: number;
  teacherFeedback?: string;
}

export interface StudentProgress {
  student: StudentProfile;
  completedBabs: number[];
  examSubmissions: Record<number, ExamSubmission>;
  essaySubmissions: Record<string, EssaySubmission>; // key: `${babId}_${questionId}`
}

export interface SimulationLogEntry {
  id: string;
  timestamp: string;
  studentId?: string;
  studentName: string;
  noAbsen?: string;
  className: string;
  school: string;
  babId: number;
  babCode: string;
  babTitle: string;
  taskNumber: number;
  taskTitle: string;
  simulationType: PracticalSimulationTask['type'];
  status: 'Berhasil' | 'Sebagian' | 'Gagal' | 'Selesai';
  score?: number;
  details?: string;
  syncedToAppsScript?: boolean;
}

export interface RombelAssignment {
  rombelKey: string; // e.g. "SMK NEGERI 1 SINGKAWANG|X TJK"
  school: string;
  className: string;
  allowedBabs: number[]; // e.g. [1, 2]
  allowedSections: {
    overview: boolean;
    simulations: boolean;
    objective: boolean;
    qualitative: boolean;
  };
  notes?: string;
  updatedAt?: string;
}

export interface McqLogEntry {
  id: string;
  timestamp: string;
  studentId?: string;
  studentName: string;
  noAbsen?: string;
  className: string;
  school: string;
  babId: number;
  babCode: string;
  babTitle: string;
  standardScore: number; // e.g. 18 / 20
  complexScore: number; // e.g. 17 / 20
  totalScore: number; // e.g. 35 / 40
  percentage: number; // e.g. 88%
  isPassed: boolean;
  timeSpentSeconds: number;
  isFlaggedTooFast?: boolean;
  syncedToAppsScript?: boolean;
}

export interface EssayLogEntry {
  id: string;
  timestamp: string;
  studentId?: string;
  studentName: string;
  noAbsen?: string;
  className: string;
  school: string;
  babId: number;
  babCode: string;
  babTitle: string;
  questionId: string;
  questionNumber: number;
  questionTitle: string;
  studentAnswer: string;
  wordCount: number;
  score?: number; // AI score or initial score
  letterGrade?: string;
  teacherScore?: number; // Manual override by teacher (0-100)
  teacherFeedback?: string; // Manual teacher notes
  gradedAt?: string;
  syncedToAppsScript?: boolean;
}

export interface DirectChatMessage {
  id: string;
  sender: 'guru' | 'siswa';
  teacherName: string;
  studentId: string;
  studentName: string;
  className: string;
  school: string;
  message: string;
  timestamp: string;
  isReadByStudent?: boolean;
  isReadByTeacher?: boolean;
  babReference?: number;
  tag?: 'teguran' | 'pengingat' | 'apresiasi' | 'bimbingan' | 'umum';
}

export interface ExamConfig {
  tokenEnabled: boolean;
  examToken: string;
  durationMinutes: number;
  sessionTitle: string;
  updatedAt: string;
}

export interface UserPresence {
  userId: string;
  role: 'siswa' | 'guru';
  userName: string;
  noAbsen?: string;
  className?: string;
  school?: string;
  currentActivity: string;
  activityCategory: 'cbt' | 'simulation' | 'essay' | 'material' | 'idle';
  babId?: number;
  babCode?: string;
  babTitle?: string;
  activeItemDetail?: string; // e.g. "Soal #14/40", "Tahap 3 Splicing FO", "Esai Studi Kasus 1"
  lastHeartbeat: string;
  isOnline: boolean;
  isTypingTo?: string; // studentId or 'teacher_simon'
  deviceLabel?: string; // e.g. "PC-14 Lab TJKT"
}

export interface StudentTaskAssignment {
  id: string;
  title: string;
  babId: number;
  babCode: string;
  babTitle: string;
  taskType: 'simulation' | 'cbt' | 'essay';
  targetType: 'all' | 'school' | 'class' | 'student';
  targetSchool?: string;
  targetClass?: string;
  targetStudentId?: string;
  targetStudentName?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}


