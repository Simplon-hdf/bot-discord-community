import axios from 'axios';

export class XPService {
  private static readonly API_URL = process.env.API_URL + '/xp';

  static async createTransaction(data: any) {
    return axios.post(this.API_URL, data);
  }

  static async getTransactions(userId: string) {
    return axios.get(`${this.API_URL}?userId=${userId}`);
  }

  static async getUserBalance(userId: string) {
    return axios.get(`${this.API_URL}/balance/${userId}`);
  }

  static async updateTransaction(id: string, data: any) {
    return axios.put(`${this.API_URL}/${id}`, data);
  }

  static async deleteTransaction(id: string) {
    return axios.delete(`${this.API_URL}/${id}`);
  }

  static async getTransaction(id: string) {
    return axios.get(`${this.API_URL}/${id}`);
  }
} 