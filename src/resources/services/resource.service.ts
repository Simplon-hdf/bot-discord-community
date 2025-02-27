import axios from 'axios';

export class ResourceService {
  private static readonly API_URL = process.env.API_URL + '/resources';

  static async createResource(data: any) {
    return axios.post(this.API_URL, data);
  }

  static async getResource(uuid: string) {
    return axios.get(`${this.API_URL}/${uuid}`);
  }
} 