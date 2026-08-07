export type Role = "admin" | "estudiante";

export type Nivel = "Básico" | "Intermedio" | "Avanzado";

export type Tipo = "cartilla" | "guia" | "vocab" | "ejercicio" | "video" | "audio";

export const TIPO_LABELS: Record<Tipo, string> = {
  cartilla: "CARTILLA",
  guia: "GUÍA",
  vocab: "VOCABULARIO",
  ejercicio: "EJERCICIO",
  video: "VIDEO",
  audio: "NOTA DE VOZ",
};

export const TIPO_ORDER: Tipo[] = ["cartilla", "guia", "vocab", "ejercicio", "video", "audio"];

export const ACTION_LABELS: Record<Tipo, string> = {
  cartilla: "Descargar PDF",
  guia: "Descargar PDF",
  vocab: "Descargar PDF",
  ejercicio: "Descargar PDF",
  video: "Ver video completo",
  audio: "Reproducir audio",
};

export const NIVELES: Nivel[] = ["Básico", "Intermedio", "Avanzado"];

export const TEMAS = [
  "Gramática",
  "Vocabulario",
  "Conversación",
  "Pronunciación",
  "Business English",
  "Viajes",
] as const;

export type Tema = (typeof TEMAS)[number];

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  created_at: string;
};

export type Resource = {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: Tipo;
  tema: string;
  nivel: Nivel;
  autor: string;
  meta: string;
  storage_path: string | null;
  created_by: string | null;
  created_at: string;
};

export type Progress = {
  user_id: string;
  resource_id: string;
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
      resources: {
        Row: Resource;
        Insert: Partial<Resource> & {
          titulo: string;
          descripcion: string;
          tipo: Tipo;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
