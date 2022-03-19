import {Request} from 'express';

export interface RequestCustom extends Request
{
    userDetails: {
        userId:string,
        fullName:string,
        email:string,
        photoUrl:string

    }
}