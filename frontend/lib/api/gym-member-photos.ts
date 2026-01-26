import { apiClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
if (!API_BASE_URL || API_BASE_URL === 'undefined') {
  throw new Error('NEXT_PUBLIC_API_URL is not defined. Please check your .env.local file.');
}

export interface PhotoUploadResponse {
  success: boolean;
  message: string;
  photoUrl: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl: string | null;
    updatedAt: string;
  };
}

export interface PhotoDeleteResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl: string | null;
    updatedAt: string;
  };
}

class GymMemberPhotosApi {
  private async getAuthHeaders(): Promise<HeadersInit> {
    // Simple approach: use the same auth as other API calls
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add tenant context - check multiple possible locations
    let tenantId = localStorage.getItem('selectedTenantId');
    
    // If not found, try to get from currentTenant object
    if (!tenantId) {
      const currentTenant = localStorage.getItem('currentTenant');
      if (currentTenant) {
        try {
          const tenant = JSON.parse(currentTenant);
          tenantId = tenant.id;
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    // If still not found, try to get from user data
    if (!tenantId) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          tenantId = user.tenantId;
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    if (tenantId) {
      headers['x-tenant-id'] = tenantId;
    }
    
    return headers;
  }

  /**
   * Upload a member photo
   */
  async uploadPhoto(memberId: string, file: File): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${API_BASE_URL}/gym/users/${memberId}/photo`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Upload failed (Status: ${response.status})`,
        error: 'Photo upload service unavailable'
      }));
      throw new Error(errorData.message || `Photo upload failed (Status: ${response.status})`);
    }

    return response.json();
  }

  /**
   * Delete a member photo
   */
  async deletePhoto(memberId: string): Promise<PhotoDeleteResponse> {
    const response = await fetch(`${API_BASE_URL}/gym/users/${memberId}/photo`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Delete failed (Status: ${response.status})`,
        error: 'Photo delete service unavailable'
      }));
      throw new Error(errorData.message || `Photo delete failed (Status: ${response.status})`);
    }

    return response.json();
  }

  /**
   * Validate image file before upload
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return {
        isValid: false,
        error: 'Please select an image file (JPG, PNG, GIF, etc.)'
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image must be smaller than 5MB'
      };
    }

    // Check supported formats
    const supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (!supportedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Supported formats: JPG, PNG, GIF, WebP'
      };
    }

    return { isValid: true };
  }

  /**
   * Create a preview URL for local file
   */
  createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to create preview'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Check if URL is a valid image
   */
  async validateImageUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  /**
   * Generate initials from name for avatar fallback
   */
  generateInitials(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return '';
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`.substring(0, 2);
  }
}

export const gymMemberPhotosApi = new GymMemberPhotosApi();
