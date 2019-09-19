import { ILoginOptios } from '../types';
export declare function loginWithToken(): Promise<{
    code: string;
    msg: string;
}>;
export declare function loginWithKey(secretId?: string, secretKey?: string): Promise<{
    code: string;
    msg: string;
}>;
export declare function login(options?: ILoginOptios): Promise<{
    code: string;
    msg: string;
}>;