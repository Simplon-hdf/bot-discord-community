import axios from 'axios';

export class VoteService {
  private static readonly API_URL = process.env.API_URL + '/votes';

  static async createVote(data: any) {
    return axios.post(this.API_URL, data);
  }

  static async getVotes(resourceId: string) {
    return axios.get(`${this.API_URL}?resourceId=${resourceId}`);
  }

  static async updateVote(id: string, data: any) {
    return axios.put(`${this.API_URL}/${id}`, data);
  }

  static async deleteVote(id: string) {
    return axios.delete(`${this.API_URL}/${id}`);
  }

  static async getVote(id: string) {
    return axios.get(`${this.API_URL}/${id}`);
  }
} 