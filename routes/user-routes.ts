const userRouteController = require('../controllers/user-controller')

import express from 'express'
import { body } from 'express-validator'
const router = express.Router()

const checkAuth = require('../utils/auth')

router.use(checkAuth)
router.get('/',userRouteController.createOrLoginUser)
router.get('/:userId/quicknotes',userRouteController.getQuickNote)

router.post('/:userId/quicknote',[
    body('title').isLength({min:3}),
    body('description').isLength({min:5})
],userRouteController.addQuickNote)

router.delete('/:userId/:qid',userRouteController.deleteQuickNote)
module.exports = router