export type QuestionId =
  | "event"
  | "reaction"
  | "thought"
  | "fear"
  | "reason"
  | "stone"
  | "choice";

export interface Question {
  id: QuestionId;
  label: string;
}

export interface JournalEntry {
  date: string;
  tags: string[];
  answers: Record<QuestionId, string>;
  createdAt: string;
  updatedAt: string;
}

export interface JournalStore {
  entries: JournalEntry[];
}
