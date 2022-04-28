import {Request,Response} from 'express'
import { RequestCustom } from '../utils/CustomRequest'

const HttpError = require('../models/http-error')
const {v4:uuidv4} = require('uuid')
const User = require('../models/user')

const getQuickNote = async(req:RequestCustom,res:Response,next:Function)=>{

    const userId = req.params.userId
    
    try{
        const user = await User.findById({_id:userId})

        const email = user.email
       
        if(req.userDetails.email!==email){
            throw new Error('User unauthorized to perform this action.')

        }
        const quicknotes = user.quicknotes
        
        res.status(200).json({quicknotes})
    }
    catch(err){
        const error = new HttpError('Unable to fetch quicknotes',500)
        next(error)
    }
    
}

const addQuickNote = async(req:Request,res:Response,next:Function)=>{

    const userId = req.params.userId

    const id = uuidv4()
    const quicknote = {...req.body,id}
    
    try {

        User.findByIdAndUpdate({ _id: userId }, { "$push": { "quicknotes": quicknote }},function(err:Error,data:any){
            if(err){
                throw new Error('Error')
            }
            else{
                res.status(201).json({ id })
            }

        })
    }
    catch (err) {
        
        const error = new HttpError(err, 500)
        next(error)
    }

}

const deleteQuickNote = async(req:RequestCustom,res:Response,next:Function)=>{
    const userId = req.params.userId
    const quickNoteId = req.params.qid
    
    try {
        const user = await User.findById(userId)
        const email = user.email
       
        if(req.userDetails.email!==email){
            throw new Error('User unauthorized to perform this action.')

        }

        await User.findByIdAndUpdate({ _id: userId }, { "$pull": { "quicknotes": {id:quickNoteId} }})
        
       
        console.log("Delete action success")
        
        res.status(200).json({ message:"Quick note deleted successfully" })
    }
    catch (err) {
        console.log("Error is caming")

        const error = new HttpError(err, 500)
        return next(error)
    }
    
}

const createOrLoginUser = async(req:RequestCustom,res:Response,next:Function)=>{

    

    const {email,fullName,photoUrl} = req.userDetails

    let uid;

    try {

        const user = await User.findOne({ email: email })

        // console.log(user)

        if (!user) {
            const user = new User({
                fullName,
                email,
                groups: [],
                forks: [],
                quicknotes: []
            })

            const userId = await user.save()

            uid = userId.toObject({getters:true}).id
           
        }
        else{
            uid = user.toObject({getters:true}).id
        }

    }
    catch (err) {
        console.log(err)
        const error = new HttpError(
            'Error signing in', 500
        )
        return next(error)
    }

    res.status(201).json({id:uid,fullName})
    // USERS.push(user)
}


module.exports = {
    getQuickNote,
    addQuickNote,
    createOrLoginUser,
    deleteQuickNote
}