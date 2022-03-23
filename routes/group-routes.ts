const groupRouteController  = require('../controllers/groups-controller')

import express,{request, Request} from 'express'
import {body} from 'express-validator'

const router = express.Router()
const multer = require('multer')
const path = require('path')

const checkAuth = require('../utils/auth')

router.use(checkAuth)

const uploadsDir = path.resolve(__dirname,'../uploads')
var storage = multer.diskStorage({
    destination: uploadsDir,
    filename: function (req:Request, file:any, cb:Function) {
        cb(null , file.originalname);
    }
});



const fileHandler = multer({storage})


router.post('/',[
body('creator').not().isEmpty(),
body('name').isLength({min:3,max:30})],
groupRouteController.createGroup)

router.get('/:userId',groupRouteController.getAllGroups)
router.get('/:userId/:groupId/forks',groupRouteController.getForkPosts)
router.get('/:groupId/:userId/posts',groupRouteController.getGroupPosts)


router.post('/:groupId',fileHandler.single('file'),groupRouteController.createPost)
router.post('/:groupId/fork',[
    body('userId').isLength({min:24,max:24}),
    body('postId').isLength({min:24,max:24})
],groupRouteController.createFork)
router.post('/join/:userId/:groupLink',groupRouteController.joinGroup)


router.delete('/:userId/unfork',groupRouteController.unforkPost)
router.delete('/:userId/:groupId',groupRouteController.leaveGroup)


//POST ROUTES




//FORK POST ROUTES





module.exports = router