const mongoose = require('mongoose')



const storage = new mongoose.Schema({
    name:String,
    location:String
})
const postSchema = new mongoose.Schema({
    creatorId:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:'User'
    },
    creatorName:String,
    groupId: {
        type:mongoose.Types.ObjectId,
        required:true,
        ref:'Group'
    },
    postTitle:String,
    description:String,
    storage,
    comments:[]
})

const postModel = mongoose.model('Post',postSchema)

module.exports = postModel

export{}