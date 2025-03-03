export function formatError(error: unknown): string {
    if (error instanceof Error) {
        return `${error.name}: ${error.message}`;
    }
    return String(error);
}

export function logError(context: string, error: unknown): void {
    console.error(`[ERROR] ${context}:`, formatError(error));
}

export function logDebug(context: string, ...args: unknown[]): void {
    console.log(`[DEBUG] ${context}:`, ...args);
}

export function logWarning(context: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${context}:`, ...args);
} 