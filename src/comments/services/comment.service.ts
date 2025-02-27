import axios from 'axios';

export class CommentService {
  private static readonly API_URL = process.env.API_URL + '/comments';

  static async createComment(data: any) {
    return axios.post(this.API_URL, data);
  }

  static async getComments(resourceUuid: string) {
    return axios.get(`${this.API_URL}?resourceUuid=${resourceUuid}`);
  }

  static async updateComment(id: string, data: any) {
    return axios.put(`${this.API_URL}/${id}`, data);
  }

  static async deleteComment(id: string) {
    return axios.delete(`${this.API_URL}/${id}`);
  }

  static async getComment(id: string) {
    return axios.get(`${this.API_URL}/${id}`);
  }
} 