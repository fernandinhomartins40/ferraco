import axios, { AxiosInstance } from 'axios';

const API_URL = '/api/upload';

/**
 * Cria instância do axios com interceptor para adicionar token
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
  });

  // Interceptor para adicionar token em todas as requisições
  client.interceptors.request.use(
    (config) => {
      const authStorage = localStorage.getItem('ferraco-auth-storage');

      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          const token = parsed.state?.token;

          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Erro ao ler token de autenticação:', error);
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

const apiClient = createApiClient();

export interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
  };
  message?: string;
}

export const uploadService = {
  /**
   * Upload de imagem única
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post<UploadResponse>('/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao fazer upload');
    }

    return response.data.data.url;
  },

  /**
   * Upload de imagem com crop e compressão
   */
  async uploadImageWithCrop(
    base64Image: string,
    width: number,
    height: number,
    quality: number = 85
  ): Promise<string> {
    const response = await apiClient.post<UploadResponse>('/image-crop', {
      image: base64Image,
      width,
      height,
      quality,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Erro ao fazer upload');
    }

    return response.data.data.url;
  },

  /**
   * Upload de múltiplas imagens
   */
  async uploadMultipleImages(files: File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file));
    return Promise.all(uploadPromises);
  },

  /**
   * Deletar imagem
   */
  async deleteImage(filename: string): Promise<void> {
    await apiClient.delete(`/image/${filename}`);
  },

  /**
   * Listar todas as imagens
   */
  async listImages(): Promise<Array<{
    filename: string;
    url: string;
    size: number;
    createdAt: string;
  }>> {
    const response = await apiClient.get('/images');
    return response.data.data;
  },
};
