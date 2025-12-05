export interface Movie {
  title: string;
  month: string;
  openingDate: string;
  productionCompany: string;
  genres: string[];
  primaryGenre?: string;
  posterFilename: string | null;
  dominantHue?: number;
}
