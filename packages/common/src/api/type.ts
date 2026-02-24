export interface APIRes<T> {
    code: 200 | 400 | 401 | 403 | 404 | 500;
    message: string;
    data: T;
}

export interface APISuccessRes<T> extends APIRes<T> {
    code: 200;
}

export interface APIErrorRes extends APIRes<null> {
    code: 400 | 401 | 403 | 404 | 500;
}