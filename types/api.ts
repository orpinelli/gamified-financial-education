export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateGameRequest {
  character_name: string;
  profession_id: string;
}

export interface AdvanceDayRequest {
  session_id: number;
  event_id: string;
  choice_id: string;
  dice_result?: number;
}
