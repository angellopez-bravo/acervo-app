export type SourceApp = "instagram" | "tiktok" | "x" | "youtube" | "otro";

export type Analysis = {
  topics: string[];
  style: string;
  appeal: string;
};

export type Item = {
  id: string;
  url: string;
  title: string;
  text: string;
  source: SourceApp;
  savedAt: number;
  thumbnail?: string;
  author?: string;
  /** Se rellena cuando la consulta de vista previa tuvo respuesta definitiva (con datos o sin ellos). */
  previewAt?: number;
  analysis?: Analysis;
};

export type ClusterLink = { to: string; reason: string };

export type Cluster = {
  id: string;
  name: string;
  summary: string;
  weight: number;
  itemIds: string[];
  links: ClusterLink[];
};

export type Profile = {
  clusters: Cluster[];
  highlights: { title: string; body: string }[];
  generatedAt: number;
};

export type Idea = {
  id: string;
  kind: "contenido" | "proyecto";
  title: string;
  why: string;
  clusterIds: string[];
  status: "nueva" | "interesa" | "descartada";
  order: number;
};
