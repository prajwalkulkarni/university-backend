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
Object.defineProperty(exports, "__esModule", { value: true });
const HttpError = require('../models/http-error');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const getQuickNote = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const user = yield User.findById({ _id: userId });
        const email = user.email;
        if (req.userDetails.email !== email) {
            throw new Error('User unauthorized to perform this action.');
        }
        const quicknotes = user.quicknotes;
        res.status(200).json({ quicknotes });
    }
    catch (err) {
        const error = new HttpError('Unable to fetch quicknotes', 500);
        next(error);
    }
});
const addQuickNote = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    const id = uuidv4();
    const quicknote = Object.assign(Object.assign({}, req.body), { id });
    try {
        User.findByIdAndUpdate({ _id: userId }, { "$push": { "quicknotes": quicknote } }, function (err, data) {
            if (err) {
                throw new Error('Error');
            }
            else {
                res.status(201).json({ id });
            }
        });
    }
    catch (err) {
        const error = new HttpError(err, 500);
        next(error);
    }
});
const deleteQuickNote = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    const quickNoteId = req.params.qid;
    try {
        const user = yield User.findById(userId);
        const email = user.email;
        if (req.userDetails.email !== email) {
            throw new Error('User unauthorized to perform this action.');
        }
        yield User.findByIdAndUpdate({ _id: userId }, { "$pull": { "quicknotes": { id: quickNoteId } } });
        console.log("Delete action success");
        res.status(200).json({ message: "Quick note deleted successfully" });
    }
    catch (err) {
        console.log("Error is caming");
        const error = new HttpError(err, 500);
        return next(error);
    }
});
const createOrLoginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, fullName, photoUrl } = req.userDetails;
    let uid;
    try {
        const user = yield User.findOne({ email: email });
        // console.log(user)
        if (!user) {
            const user = new User({
                fullName,
                email,
                groups: [],
                forks: [],
                quicknotes: []
            });
            const userId = yield user.save();
            uid = userId.toObject({ getters: true }).id;
        }
        else {
            uid = user.toObject({ getters: true }).id;
        }
    }
    catch (err) {
        console.log(err);
        const error = new HttpError('Error signing in', 500);
        return next(error);
    }
    res.status(201).json({ id: uid, fullName });
    // USERS.push(user)
});
module.exports = {
    getQuickNote,
    addQuickNote,
    createOrLoginUser,
    deleteQuickNote
};
