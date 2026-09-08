/**
 * A binary attachment stored in the "photos" object store, keyed by id.
 * Not currently wired into any page — kept for a later enhancement.
 */
export interface PhotoAttachment {
  id: string;
  blob: Blob;
  createdAt: number;
}
