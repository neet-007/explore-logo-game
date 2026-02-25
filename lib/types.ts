export type Criterion = {
  id: number;
  textAr: string;
  isOmitted: boolean;
};

export type Question = {
  id: number;
  logoPath: string;
  criteria: Criterion[];
};

export type PublicCriterion = {
  id: number;
  textAr: string;
};

export type PublicQuestion = {
  id: number;
  logoPath: string;
  criteria: PublicCriterion[];
};

export type AnswerPayload = {
  questionId: number;
  selectedCriterionIds: number[];
};

export type LeaderboardEntry = {
  id: number;
  playerName: string;
  score: number;
  maxScore: number;
  createdAt: string;
};
