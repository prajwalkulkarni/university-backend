"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userRouteController = require('../controllers/user-controller');
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const checkAuth = require('../utils/auth');
router.use(checkAuth);
router.get('/', userRouteController.createOrLoginUser);
router.get('/:userId/quicknotes', userRouteController.getQuickNote);
router.post('/:userId/quicknote', [
    (0, express_validator_1.body)('title').isLength({ min: 3 }),
    (0, express_validator_1.body)('description').isLength({ min: 5 })
], userRouteController.addQuickNote);
router.delete('/:userId/:qid', userRouteController.deleteQuickNote);
module.exports = router;
