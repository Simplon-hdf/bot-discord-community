import { User, GuildMember } from 'discord.js';

export function getDisplayName(member: GuildMember | User): string {
    if (member instanceof GuildMember) {
        return member.displayName;
    }
    return member.username;
}

export function createEmbedFooter(displayName: string): string {
    return `Ressource partagée par ${displayName}`;
}

export function createInitialMessage(displayName: string): string {
    return `📚 Ressource créée par ${displayName}`;
} 