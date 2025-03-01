export interface Resource {
    title: string;
    description: string;
    color: string;
    tags: string[];
    authorId: string;
    authorName: string;
    createdAt: Date;
}

export interface TempResourceData {
    title: string;
    description: string;
    color: string;
    userId: string;
    timestamp: number;
    selectedTags?: string[];
}

export interface ResourceTag {
    label: string;
    value: string;
    description?: string;
}

export interface ResourceColor {
    label: string;
    value: string;
    description: string;
} 