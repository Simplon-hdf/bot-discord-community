import { ApiService } from './api.service';
import { MemberInformationCreateDto, MemberInformationDto } from '../types/member-information.types';
import { ApiResponse } from '../types/base.types';
import { logDebug, logError } from '../../utils/error.utils';

/**
 * Service pour interagir avec l'API des informations membres
 */
export class MemberInformationApiService {
  private static instance: MemberInformationApiService;
  private apiService: ApiService;
  private readonly endpoint = 'members-informations';

  private constructor() {
    this.apiService = ApiService.getInstance();
  }

  /**
   * Obtient l'instance unique du service (Singleton)
   */
  public static getInstance(): MemberInformationApiService {
    if (!MemberInformationApiService.instance) {
      MemberInformationApiService.instance = new MemberInformationApiService();
    }
    return MemberInformationApiService.instance;
  }

  /**
   * Récupère toutes les informations des membres
   */
  public async getAllMemberInformations(): Promise<MemberInformationDto[]> {
    try {
      const response = await this.apiService.get<MemberInformationDto[]>(this.endpoint);
      return response.data;
    } catch (error) {
      logError('Get All Member Informations', error);
      return [];
    }
  }

  /**
   * Recherche les informations d'un membre par email
   */
  public async findMemberInformationByEmail(email: string): Promise<MemberInformationDto | null> {
    try {
      const allInfos = await this.getAllMemberInformations();
      const foundInfo = allInfos.find(info => info.email === email);
      return foundInfo || null;
    } catch (error) {
      logError('Find Member Information By Email', error);
      return null;
    }
  }

  /**
   * Crée de nouvelles informations pour un membre
   */
  public async createMemberInformation(data: MemberInformationCreateDto): Promise<MemberInformationDto | null> {
    try {
      logDebug('Create Member Information', { data });
      const response = await this.apiService.post<MemberInformationDto>(this.endpoint, data);
      return response.data;
    } catch (error) {
      logError('Create Member Information', error);
      throw error;
    }
  }
} 