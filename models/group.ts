const mongoose = require('mongoose')


const groupSchema = new mongoose.Schema({
    creatorId:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:'User'
    },
    members:[{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:'User'
    }],
    groupName: String,
    groupLink: String
})

const groupModel = mongoose.model('Group',groupSchema)

module.exports = groupModel

export{}