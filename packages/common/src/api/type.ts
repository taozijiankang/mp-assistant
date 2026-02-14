export interface ApiResponse<T> {
    code: 200 | 400 | 401 | 403 | 404 | 500;
    message: string;
    data: T | null;
}