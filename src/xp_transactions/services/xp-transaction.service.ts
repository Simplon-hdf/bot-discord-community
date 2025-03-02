import axios from 'axios';

export class XpTransactionService {
  private static readonly API_URL = process.env.API_URL + '/xp-transactions';

  static async createXpTransaction(data: any) {
    return axios.post(this.API_URL, data);
  }

  static async getXpTransactions(userId: string) {
    return axios.get(`${this.API_URL}?userId=${userId}`);
  }

  static async updateXpTransaction(id: string, data: any) {
    return axios.put(`${this.API_URL}/${id}`, data);
  }

  static async deleteXpTransaction(id: string) {
    return axios.delete(`${this.API_URL}/${id}`);
  }

  static async getXpTransaction(id: string) {
    return axios.get(`${this.API_URL}/${id}`);
  }
} 