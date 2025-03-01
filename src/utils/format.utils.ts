export function formatTags(tags: string[]): string {
    return tags.join(', ');
}

export function formatEmbedColor(hexColor: string): number {
    return parseInt(hexColor, 16);
}

export function truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}

export function formatResourceTitle(displayName: string, title: string): string {
    return `${displayName} | ${truncateString(title, 80)}`;
} 