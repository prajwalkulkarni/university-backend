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
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const HttpError = require('../models/http-error');
const googleAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (req.method === 'OPTIONS') {
        return next();
    }
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    try {
        const ticket = yield client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;
        const userId = sub;
        req.userDetails = {
            userId,
            email,
            fullName: name,
            photoUrl: picture
        };
        return next();
    }
    catch (error) {
        console.log(error);
        const httpError = new HttpError('User unautorized to perform this action', 401);
        return next(httpError);
    }
});
module.exports = googleAuth;
