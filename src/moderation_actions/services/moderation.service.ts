import axios from 'axios';

export class ModerationService {
  private static readonly API_URL = process.env.API_URL + '/moderation_actions';

  static async createAction(data: any) {
    return axios.post(this.API_URL, data);
  }

  static async getActions(userId: string) {
    return axios.get(`${this.API_URL}?userId=${userId}`);
  }

  static async updateAction(id: string, data: any) {
    return axios.put(`${this.API_URL}/${id}`, data);
  }

  static async deleteAction(id: string) {
    return axios.delete(`${this.API_URL}/${id}`);
  }

  static async getAction(id: string) {
    return axios.get(`${this.API_URL}/${id}`);
  }

  static async getAllActions() {
    return axios.get(this.API_URL);
  }
} 