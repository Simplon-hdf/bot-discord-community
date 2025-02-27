import axios from 'axios';

export class ReportService {
  private static readonly API_URL = process.env.API_URL + '/reports';

  static async createReport(data: any) {
    return axios.post(this.API_URL, data);
  }

  static async getReports(resourceId: string) {
    return axios.get(`${this.API_URL}?resourceId=${resourceId}`);
  }

  static async updateReport(id: string, data: any) {
    return axios.put(`${this.API_URL}/${id}`, data);
  }

  static async deleteReport(id: string) {
    return axios.delete(`${this.API_URL}/${id}`);
  }

  static async getReport(id: string) {
    return axios.get(`${this.API_URL}/${id}`);
  }

  static async getAllReports() {
    return axios.get(this.API_URL);
  }

  static async getReportsByStatus(status: string) {
    return axios.get(`${this.API_URL}?status=${status}`);
  }
} 