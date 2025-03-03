export function isValidTitle(title: string): boolean {
    return title.length >= 3 && title.length <= 100;
}

export function isValidDescription(description: string): boolean {
    return description.length >= 10 && description.length <= 4000;
}

export function isValidTagCount(tags: string[]): boolean {
    return tags.length >= 1 && tags.length <= 3;
}

export function isValidColor(color: string): boolean {
    return /^0x[0-9A-Fa-f]{6}$/.test(color);
} 