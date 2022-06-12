import {Request,Response} from 'express'
import s3 from '../utils/sdk'
import { PostState } from "../utils/types";
import { ObjectId } from "mongodb";
import { validationResult } from 'express-validator';
import { RequestCustom } from '../utils/CustomRequest';

const { Readable } = require('stream');
const mongoose = require('mongoose')

const fs = require('fs')
const {promisify} = require('util')
const unlinkAsync = promisify(fs.unlink)
const HttpError = require('../models/http-error')


const Group = require('../models/group')
const User = require('../models/user')
const Post = require('../models/post')

const ShortId = require('id-shorter');

const mongoDBShortId = ShortId({
    isFullId:true
});

//GROUPS
const createGroup = async(req:Request,res:Response,next:Function)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError(errors.array()[0].msg,400))
    }
    const {name:groupName,creator:creatorId} = req.body

    try{
       
        const newGroup = new Group({
            groupName,
            members:[creatorId],
            creatorId,
            groupLink:''
    
        })

        let user = await User.findById(creatorId)

        
        const session = await mongoose.startSession()
        session.startTransaction()
        var groupId= await newGroup.save({session})
        groupId = groupId.toObject({getters:true}).id
        var shortId = mongoDBShortId.encode(groupId);
        
        user.groups.push(newGroup)
        await user.save({session})
        await session.commitTransaction()


        Group.findByIdAndUpdate(groupId,{"$set":{"groupLink":shortId}},function(error:Error,model:any){
            if(!error){
                console.log("Appended group link")
            }
            else{
                throw new HttpError(error,500)
            }
        })

    }
    catch(err:any){
        // console.log(err)
        const error =  new HttpError(err.message||'Creating group failed',500)

        return next(error)
    }

    res.status(201).json({message:"Group created successfully",groupId,name:groupName,groupLink:shortId})

}

const getAllGroups = async(req:RequestCustom,res:Response,next:Function)=>{
    const userId = req.params.userId
    let userGroups
    try{
        const user = await User.findById(userId)
        const email = user.email
       
        if(req.userDetails.email!==email){
            throw new Error('User unauthorized to perform this action.')

        }
        userGroups = await User.findById(userId).populate('groups')
        
        if(!userGroups){
            
            throw new Error('catch it')
            // return next(new HttpError('Could not find groups for the user',404))

        }
        if(userGroups && userGroups.groups.length===0){
            return res.status(200).json({groups:[]})
        }
        
    }
    catch(error){
        // console.log("Log it")
        const err = new HttpError('Could not fetch groups for given id',404)
        return next(err)
    }


    res.status(200).json({groups:userGroups.groups.map((group:any)=>group.toObject({getters:true}))})
}


const joinGroup = async(req:Request,res:Response,next:Function)=>{

    const {userId,groupLink} = req.params

    
    try{
        const user = await User.findById(userId)
        let group = await Group.findOne({groupLink})
        const groupDetails = group.toObject({getters:true})
        const isRegistered = user.groups.some(function(id:ObjectId){
            return id.equals(groupDetails.id)
        })

        
        
        if(!isRegistered && group){

            const session = await mongoose.startSession()
            session.startTransaction()
            group.members.push(user)
            user.groups.push(group)
            await user.save({session})
            await group.save({session})
            await session.commitTransaction()
        }
        else{
            throw new Error('User already part of group or group doesnt exist anymore')
        }

        res.status(201).json({message:"User added to group successfully"})
    }
    catch(err){
        // console.log(err)
        const error = new HttpError('Could not join group, either the group doesnt exist, or the link is broken',400)

        next(error)
    }
    

}


const leaveGroup = async(req:RequestCustom,res:Response,next:Function) => {

    
    const {userId,groupId:id} = req.params
  
    
    try{
        
        const user = await User.findById(userId)
        const email = user.email
       
        if(req.userDetails.email!==email){
            throw new Error('User unauthorized to perform this action.')

        }
        const group = await Group.findById(id)

        const session = await mongoose.startSession()    
        session.startTransaction()
        user.groups.pull(id)
        group.members.pull(userId)
        await user.save({session})
        await group.save({session})
        await session.commitTransaction()

        res.status(200).json({message:"No more part of the group"})
    }
    catch(err:any){
        const error  = new HttpError(err.message,500)

        next(error)
    }




    
}


//POSTS
const createPost = async(req:Request,res:Response,next:Function)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg,400))
    }
    
    const {groupId} =req.params
    // console.log(req.file)
    const {postTitle,description,creatorId,creatorName} = req.body

    let postId
    let uploadRes:any
    let path 
    try{
        // const Attachment:any = createModel()
    
        const fileBuffer = (req as any).file

        
        if (fileBuffer) {
            path = `uploads/${fileBuffer.originalname}`
            const stream = fs.createReadStream(path)
            
            
            const params = {
                Bucket: 'bucket-filestorage', // pass your bucket name
                ContentType:fileBuffer.mimetype,
                ContentDisposition: 'inline',
                Key: fileBuffer.originalname, // file will be saved as testBucket/contacts.csv
                Body: stream
            };

            const upload = new Promise((resolve,reject)=>{
                s3.upload(params, function(s3Err:Error, data:Object) {
                    if (s3Err) reject(s3Err)
                    // console.log(`File uploaded successfully at ${data.Location}`)
                    resolve(data)
                });
            })

            uploadRes = await upload 
            
            await unlinkAsync(path)
            // const readStream = createReadStream(fileBuffer.originalname)
        }
        
        const newPost = new Post({
            creatorId,
            creatorName,
            groupId,
            postTitle,
            description,
            storage:uploadRes?{location:uploadRes.Location,name:fileBuffer.originalname}:null,
            comments:[] as any
        })
        postId = await newPost.save();

        
    }

    catch(error){
        console.log(error)
        next(new HttpError(error,500))
    }
    

    res.status(201).json({postId:postId.toObject({getters:true}).id,postTitle,description,link:postId.toObject({getters:true}).storage?.location??null})

}

const getGroupPosts = async(req:RequestCustom,res:Response,next:Function)=>{

    const {groupId,userId} = req.params
    let groupPosts
    
    let user

    
    try {

        groupPosts = await Post.find({ groupId })
        user = await User.findById({ _id: userId })


        const email = user.email
       
        if(req.userDetails.email!==email){
            throw new Error('User unauthorized to perform this action.')

        }
        // console.log(user)
        const forks = user.forks.map((fork: any) => fork.toString())

        groupPosts = groupPosts.map((groupPost: any) => groupPost.toObject({ getters: true }))

        groupPosts = groupPosts.map((groupPost: any) => {
            return {
                ...groupPost,
                forked: forks.includes(groupPost.id) ?? false
            }
        })

        res.status(200).json({ posts: groupPosts })

    }
    catch (err) {
        console.log(err)
        next(new HttpError('Could not fetch posts for the group', 404))
    }

    // const groupPosts = ALL_POSTS.filter(post=>post.groupId===groupId)
    
    
}


//FORKS

const createFork = async(req:Request,res:Response,next:Function)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg,400))
    }

    
    const {groupId} = req.params
    const {userId,postId} = req.body
    
    try{
        const userObj = await User.findById(userId).populate('forks')
        
        const checkIfForked = userObj.forks.find((fork:PostState)=>fork.id===postId&&fork.groupId===groupId)

        console.log(!!checkIfForked)
    
        if(!checkIfForked){
            // const forkPost = ALL_POSTS.find(post=>post.postId===postId&&post.groupId===groupId)
            userObj.forks.push(postId)
            await userObj.save()
            
            
        }

        res.status(201).json({message:"Post forked successfully"})
    }
    catch(err){
        // console.log(err)
        next(new HttpError('Forking post failed',500))
        // res.status(500).json({message:"Unknwon error occured, please try after sometime."})
    }

}

const getForkPosts = async(req:RequestCustom,res:Response,next:Function)=>{
    const {groupId,userId} = req.params

    
    try{

        const user = await User.findById(userId)
        const email = user.email
       
        if(req.userDetails.email!==email){
            throw new Error('User unauthorized to perform this action.')

        }
        
        const userForkPosts = await User.findById(userId).populate('forks')
        

        const forkPostsCollection = userForkPosts.forks.filter((post:PostState)=>post.groupId.toString()===groupId) 
        
        if(forkPostsCollection.length>0){
            res.status(200).json({forkposts:forkPostsCollection.map((forkPost:any)=>forkPost.toObject({getters:true}))})
        }
        else{
            res.status(200).json({forkposts:[]})
        }
    }
    catch(err){
        console.log(err)
        next(new HttpError('Could not fetch forked posts for this group',500))
    }
    
}

const unforkPost = async(req:RequestCustom,res:Response,next:Function) => {

    const {userId} = req.params
    const {postId} = req.body

    // console.log(userId,postId)

    try{
        
        const user = await User.findById(userId)
        const email = user.email
       
        if(req.userDetails.email!==email){
            throw new Error('User unauthorized to perform this action.')

        }
        await User.findByIdAndUpdate(userId,{"$pull":{"forks":postId}})

        return res.status(204).json({message:'Post unforked successfully'})
    }catch(err:unknown){
        console.log(err)
        next(new HttpError('Could not unfork post',500))
    }
}






module.exports = {
    getAllGroups,
    getGroupPosts,
    getForkPosts,
    createGroup,
    joinGroup,
    leaveGroup,
    createPost,
    createFork,
    unforkPost
}