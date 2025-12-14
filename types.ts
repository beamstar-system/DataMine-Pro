export interface DatasetColumn {
  name: string;
  description?: string;
}

export interface GeneratorConfig {
  topic: string;
  columns: DatasetColumn[];
  rowCount: number;
  context?: string;
}

export interface DatasetRow {
  [key: string]: string | number | boolean | null;
}

export interface GeneratedDataset {
  id: string;
  timestamp: number;
  config: GeneratorConfig;
  data: DatasetRow[];
  sources: string[];
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}