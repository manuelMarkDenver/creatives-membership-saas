export interface StorageProvider {
  /**
   * Upload member photo
   */
  uploadMemberPhoto(
    memberId: string,
    tenantId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; path: string }>;

  /**
   * Delete member photo
   */
  deleteMemberPhoto(photoPath: string): Promise<boolean>;

  /**
   * Extract photo path from URL (for deletion)
   */
  extractPhotoPath?(photoUrl: string): string | null;

  /**
   * Generate a fresh signed URL for an existing photo
   */
  getSignedPhotoUrl?(photoPath: string): Promise<string>;
}
