import { Schema } from "mongoose"

const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    // userId:String,
    
    groups:[{
        type: mongoose.Types.ObjectId,
        required: true,
        ref:'Group'
    }],
    forks:[{
        type: mongoose.Types.ObjectId,
        required:false,
        ref:'Post'
    }],
    quicknotes:{
        type: Array
    }
})


const userModel = mongoose.model('User',userSchema)

module.exports = userModel

export{}