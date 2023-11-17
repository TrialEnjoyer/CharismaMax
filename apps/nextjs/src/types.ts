export interface Scenario {
  id: number;
  created_at: Date;
  intended_difficulty: string | null;
  text: string;
  name: string;
  description: string | null;
}
export interface Difficulty {
  id: number;
  created_at: Date;
  name: string;
  intended_rating: string | null;
  text: string;
}
export interface Characters {
  id: string;
  created_at: Date;
  backstory: string;
  image: string | null;
}
export interface Conversation {
  id?: number;
  userId: string; // Assuming UUIDs are represented as strings in TypeScript
  type: string;
  createdA?: Date;
  review?: string | undefined;
  score?: number | undefined;
  title: string;
  difficulty_text: string | undefined;
  scenario_id: string | undefined;
  character_id: string | undefined;
  difficulty_name: string | undefined;
  scenario_name: string | undefined;
  character_text: string | undefined;
  scenario_text: string | undefined;
}

export type message = {
  id: number;
  conversationId: number;
  text: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  score?: number;
  review?: string;
  reply?: string;
  history: string[];
};
