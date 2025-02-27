import axios from 'axios';

export class TagService {
  private static readonly API_URL = process.env.API_URL + '/tags';

  static async createTag(data: any) {
    return axios.post(this.API_URL, data);
  }

  static async getTags() {
    return axios.get(this.API_URL);
  }

  static async getTag(name: string) {
    return axios.get(`${this.API_URL}/${name}`);
  }

  static async updateTag(name: string, data: any) {
    return axios.put(`${this.API_URL}/${name}`, data);
  }

  static async deleteTag(name: string) {
    return axios.delete(`${this.API_URL}/${name}`);
  }
} 