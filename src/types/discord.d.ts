import { Client } from 'discord.js';

declare module 'discord.js' {
  export interface Client {
    resourceTemp?: {
      title: string;
      description: string;
      userId: string;
      timestamp: number;
    };
  }
} 