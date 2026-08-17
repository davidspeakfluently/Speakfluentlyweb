export type Role = "admin" | "profesor" | "estudiante";

export type Nivel = "Básico" | "Intermedio" | "Avanzado";

export const NIVELES: Nivel[] = ["Básico", "Intermedio", "Avanzado"];

/** Comportamiento de reproducción/descarga — determina qué player se usa. */
export type Kind = "documento" | "audio" | "video" | "juego";

export const ACTION_LABEL_BY_KIND: Record<Kind, string> = {
  documento: "Descargar PDF",
  audio: "Reproducir audio",
  video: "Ver video completo",
  juego: "Jugar",
};

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  created_at: string;
};

export type Tema = {
  id: string;
  nombre: string;
  orden: number;
  created_at: string;
};

export type TipoRecurso = {
  key: string;
  label: string;
  kind: Kind;
  orden: number;
  created_at: string;
};

export type Resource = {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  tema: string;
  nivel: Nivel;
  autor: string;
  meta: string;
  storage_path: string | null;
  video_url: string | null;
  created_by: string | null;
  created_at: string;
};

export type Progress = {
  user_id: string;
  resource_id: string;
  completed_at: string;
};

export type GameWord = {
  id: string;
  resource_id: string;
  en: string;
  es: string;
  orden: number;
  created_at: string;
};

export type GameAttempt = {
  id: string;
  user_id: string;
  resource_id: string;
  score: number;
  total: number;
  completed_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string; display_name: string; role: Role };
        Update: Partial<Profile>;
        Relationships: [];
      };
      temas: {
        Row: Tema;
        Insert: Partial<Tema> & { nombre: string };
        Update: Partial<Tema>;
        Relationships: [];
      };
      tipos_recurso: {
        Row: TipoRecurso;
        Insert: Partial<TipoRecurso> & { key: string; label: string; kind: Kind };
        Update: Partial<TipoRecurso>;
        Relationships: [];
      };
      resources: {
        Row: Resource;
        Insert: Partial<Resource> & {
          titulo: string;
          descripcion: string;
          tipo: string;
          tema: string;
          nivel: Nivel;
          autor: string;
          meta: string;
        };
        Update: Partial<Resource>;
        Relationships: [];
      };
      progress: {
        Row: Progress;
        Insert: Partial<Progress> & { user_id: string; resource_id: string };
        Update: Partial<Progress>;
        Relationships: [];
      };
      game_words: {
        Row: GameWord;
        Insert: Partial<GameWord> & { resource_id: string; en: string; es: string };
        Update: Partial<GameWord>;
        Relationships: [];
      };
      game_attempts: {
        Row: GameAttempt;
        Insert: Partial<GameAttempt> & {
          user_id: string;
          resource_id: string;
          score: number;
          total: number;
        };
        Update: Partial<GameAttempt>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
