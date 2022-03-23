"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("../utils/sdk"));
const express_validator_1 = require("express-validator");
const { Readable } = require('stream');
const mongoose = require('mongoose');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const HttpError = require('../models/http-error');
const Group = require('../models/group');
const User = require('../models/user');
const Post = require('../models/post');
const ShortId = require('id-shorter');
const mongoDBShortId = ShortId({
    isFullId: true
});
//GROUPS
const createGroup = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 400));
    }
    const { name: groupName, creator: creatorId } = req.body;
    try {
        const newGroup = new Group({
            groupName,
            members: [creatorId],
            creatorId,
            groupLink: ''
        });
        let user = yield User.findById(creatorId);
        const session = yield mongoose.startSession();
        session.startTransaction();
        var groupId = yield newGroup.save({ session });
        groupId = groupId.toObject({ getters: true }).id;
        var shortId = mongoDBShortId.encode(groupId);
        user.groups.push(newGroup);
        yield user.save({ session });
        yield session.commitTransaction();
        Group.findByIdAndUpdate(groupId, { "$set": { "groupLink": shortId } }, function (error, model) {
            if (!error) {
                console.log("Appended group link");
            }
            else {
                throw new HttpError(error, 500);
            }
        });
    }
    catch (err) {
        // console.log(err)
        const error = new HttpError(err.message || 'Creating group failed', 500);
        return next(error);
    }
    res.status(201).json({ message: "Group created successfully", groupId, name: groupName, groupLink: shortId });
});
const getAllGroups = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    let userGroups;
    try {
        const user = yield User.findById(userId);
        const email = user.email;
        if (req.userDetails.email !== email) {
            throw new Error('User unauthorized to perform this action.');
        }
        userGroups = yield User.findById(userId).populate('groups');
        if (!userGroups) {
            throw new Error('catch it');
            // return next(new HttpError('Could not find groups for the user',404))
        }
        if (userGroups && userGroups.groups.length === 0) {
            return res.status(200).json({ groups: [] });
        }
    }
    catch (error) {
        // console.log("Log it")
        const err = new HttpError('Could not fetch groups for given id', 404);
        return next(err);
    }
    res.status(200).json({ groups: userGroups.groups.map((group) => group.toObject({ getters: true })) });
});
const joinGroup = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, groupLink } = req.params;
    try {
        const user = yield User.findById(userId);
        let group = yield Group.findOne({ groupLink });
        const groupDetails = group.toObject({ getters: true });
        const isRegistered = user.groups.some(function (id) {
            return id.equals(groupDetails.id);
        });
        if (!isRegistered && group) {
            const session = yield mongoose.startSession();
            session.startTransaction();
            group.members.push(user);
            user.groups.push(group);
            yield user.save({ session });
            yield group.save({ session });
            yield session.commitTransaction();
        }
        else {
            throw new Error('User already part of group or group doesnt exist anymore');
        }
        res.status(201).json({ message: "User added to group successfully" });
    }
    catch (err) {
        // console.log(err)
        const error = new HttpError('Could not join group, either the group doesnt exist, or the link is broken', 400);
        next(error);
    }
});
const leaveGroup = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, groupId: id } = req.params;
    try {
        const user = yield User.findById(userId);
        const email = user.email;
        if (req.userDetails.email !== email) {
            throw new Error('User unauthorized to perform this action.');
        }
        const group = yield Group.findById(id);
        const session = yield mongoose.startSession();
        session.startTransaction();
        user.groups.pull(id);
        group.members.pull(userId);
        yield user.save({ session });
        yield group.save({ session });
        yield session.commitTransaction();
        res.status(200).json({ message: "No more part of the group" });
    }
    catch (err) {
        const error = new HttpError(err.message, 500);
        next(error);
    }
});
//POSTS
const createPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 400));
    }
    const { groupId } = req.params;
    // console.log(req.file)
    const { postTitle, description, creatorId, creatorName } = req.body;
    let postId;
    let uploadRes;
    let path;
    try {
        // const Attachment:any = createModel()
        const fileBuffer = req.file;
        if (fileBuffer !== undefined) {
            path = `out/uploads/${fileBuffer.originalname}`;
            const stream = fs.createReadStream(path);
            const params = {
                Bucket: 'bucket-filestorage',
                ContentType: fileBuffer.mimetype,
                ContentDisposition: 'inline',
                Key: fileBuffer.originalname,
                Body: stream
            };
            const upload = new Promise((resolve, reject) => {
                sdk_1.default.upload(params, function (s3Err, data) {
                    if (s3Err)
                        reject(s3Err);
                    // console.log(`File uploaded successfully at ${data.Location}`)
                    resolve(data);
                });
            });
            uploadRes = yield upload;
            yield unlinkAsync(path);
            // const readStream = createReadStream(fileBuffer.originalname)
        }
        const newPost = new Post({
            creatorId,
            creatorName,
            groupId,
            postTitle,
            description,
            storage: uploadRes ? { location: uploadRes.Location, name: fileBuffer.originalname } : null,
            comments: []
        });
        postId = yield newPost.save();
    }
    catch (error) {
        console.log(error);
        next(new HttpError(error, 500));
    }
    res.status(201).json({ postId: postId.toObject({ getters: true }).id, link: (_b = (_a = postId.toObject({ getters: true }).storage) === null || _a === void 0 ? void 0 : _a.location) !== null && _b !== void 0 ? _b : null });
});
const getGroupPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { groupId, userId } = req.params;
    let groupPosts;
    let user;
    try {
        groupPosts = yield Post.find({ groupId });
        user = yield User.findById({ _id: userId });
        const email = user.email;
        if (req.userDetails.email !== email) {
            throw new Error('User unauthorized to perform this action.');
        }
        // console.log(user)
        const forks = user.forks.map((fork) => fork.toString());
        groupPosts = groupPosts.map((groupPost) => groupPost.toObject({ getters: true }));
        groupPosts = groupPosts.map((groupPost) => {
            var _a;
            return Object.assign(Object.assign({}, groupPost), { forked: (_a = forks.includes(groupPost.id)) !== null && _a !== void 0 ? _a : false });
        });
        res.status(200).json({ posts: groupPosts });
    }
    catch (err) {
        console.log(err);
        next(new HttpError('Could not fetch posts for the group', 404));
    }
    // const groupPosts = ALL_POSTS.filter(post=>post.groupId===groupId)
});
//FORKS
const createFork = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(errors.array()[0].msg, 400));
    }
    const { groupId } = req.params;
    const { userId, postId } = req.body;
    try {
        const userObj = yield User.findById(userId).populate('forks');
        const checkIfForked = userObj.forks.find((fork) => fork.id === postId && fork.groupId === groupId);
        console.log(!!checkIfForked);
        if (!checkIfForked) {
            // const forkPost = ALL_POSTS.find(post=>post.postId===postId&&post.groupId===groupId)
            userObj.forks.push(postId);
            yield userObj.save();
        }
        res.status(201).json({ message: "Post forked successfully" });
    }
    catch (err) {
        // console.log(err)
        next(new HttpError('Forking post failed', 500));
        // res.status(500).json({message:"Unknwon error occured, please try after sometime."})
    }
});
const getForkPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { groupId, userId } = req.params;
    try {
        const user = yield User.findById(userId);
        const email = user.email;
        if (req.userDetails.email !== email) {
            throw new Error('User unauthorized to perform this action.');
        }
        const userForkPosts = yield User.findById(userId).populate('forks');
        const forkPostsCollection = userForkPosts.forks.filter((post) => post.groupId.toString() === groupId);
        if (forkPostsCollection.length > 0) {
            res.status(200).json({ forkposts: forkPostsCollection.map((forkPost) => forkPost.toObject({ getters: true })) });
        }
        else {
            res.status(200).json({ forkposts: [] });
        }
    }
    catch (err) {
        console.log(err);
        next(new HttpError('Could not fetch forked posts for this group', 500));
    }
});
const unforkPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { postId } = req.body;
    // console.log(userId,postId)
    try {
        const user = yield User.findById(userId);
        const email = user.email;
        if (req.userDetails.email !== email) {
            throw new Error('User unauthorized to perform this action.');
        }
        yield User.findByIdAndUpdate(userId, { "$pull": { "forks": postId } });
        return res.status(204).json({ message: 'Post unforked successfully' });
    }
    catch (err) {
        console.log(err);
        next(new HttpError('Could not unfork post', 500));
    }
});
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
};
