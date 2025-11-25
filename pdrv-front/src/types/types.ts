export interface Availability {
    id: number;
    user_id?: number;
    type: string;
    start: Date;
    end: Date;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    title?: string;
    active?: string;
    status?: string;
}