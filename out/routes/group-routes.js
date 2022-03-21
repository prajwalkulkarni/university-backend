"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const groupRouteController = require('../controllers/groups-controller');
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const multer = require('multer');
const path = require('path');
const checkAuth = require('../utils/auth');
router.use(checkAuth);
const uploadsDir = path.resolve(__dirname, 'uploads');
var storage = multer.diskStorage({
    destination: uploadsDir,
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const fileHandler = multer({ storage });
router.post('/', [
    (0, express_validator_1.body)('creator').not().isEmpty(),
    (0, express_validator_1.body)('name').isLength({ min: 3, max: 30 })
], groupRouteController.createGroup);
router.get('/:userId', groupRouteController.getAllGroups);
router.get('/:userId/:groupId/forks', groupRouteController.getForkPosts);
router.get('/:groupId/:userId/posts', groupRouteController.getGroupPosts);
router.post('/:groupId', fileHandler.single('file'), groupRouteController.createPost);
router.post('/:groupId/fork', [
    (0, express_validator_1.body)('userId').isLength({ min: 24, max: 24 }),
    (0, express_validator_1.body)('postId').isLength({ min: 24, max: 24 })
], groupRouteController.createFork);
router.post('/join/:userId/:groupLink', groupRouteController.joinGroup);
router.delete('/:userId/unfork', groupRouteController.unforkPost);
router.delete('/:userId/:groupId', groupRouteController.leaveGroup);
//POST ROUTES
//FORK POST ROUTES
module.exports = router;
