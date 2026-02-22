export type Episode = {
  id: string;             // UUID or simple timestamp-based ID
  title: string;          // e.g., "Tập 1", "Full Movie"
  driveId: string;        // The Google Drive File ID (Source of Truth)
  order: number;          // For sorting episodes (1, 2, 3...)
};

export interface Movie {
  id: string;             // Firestore Document ID
  title: string;          // Movie/Series Name
  posterUrl: string;      // Vertical poster image URL
  backdropUrl?: string;   // Horizontal background image (optional)
  description?: string;
  category: 'movie' | 'series'; // Logic flag
  isCompleted: boolean;   // Useful for series (End vs Ongoing)
  isVip: boolean;         // If true, only VIP/Editor/Admin can watch
  episodes: Episode[];    // Array. If 'movie', this has 1 element. If 'series', >1.
  createdAt: number;      // Timestamp
  updatedAt: number;      // Timestamp
}
