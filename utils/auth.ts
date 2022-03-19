import {Request,Response} from 'express'
import {RequestCustom} from './CustomRequest' 
const {OAuth2Client} = require('google-auth-library')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const HttpError = require('../models/http-error')

const googleAuth = async(req:RequestCustom,res:Response,next:Function)=>{
 
    if(req.method==='OPTIONS'){
        return next()
    }
    const token = req.headers.authorization?.split(' ')[1]

    try{
        
        const ticket = await client.verifyIdToken({
            idToken:token,
            audience:process.env.GOOGLE_CLIENT_ID,
        });
    
        const payload = ticket.getPayload()
    
        const {sub, email, name, picture} = payload
    
        const userId = sub;
    
        req.userDetails = {
            userId,
            email,
            fullName:name,
            photoUrl:picture
        }

        return next()
    }
    catch(error){
        console.log(error)
        const httpError = new HttpError('User unautorized to perform this action',401)
        
        return next(httpError)
    }
}

module.exports = googleAuth