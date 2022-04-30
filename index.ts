import {Request,response,Response} from 'express'
import { HttpErrorType } from './utils/types';
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}



const HttpError = require('./models/http-error')
const express = require('express')
const mongoose = require('mongoose')
const app = express()


const userRouter = require('./routes/user-routes')
const groupRouter = require('./routes/group-routes')

const PORT_NO = 1337

app.use(express.json())
app.use(express.urlencoded({extended:true}))


app.use((req:Request,res:Response,next:Function)=>{

    // res.setHeader('Access-Control-Allow-Origin','https://www.eduwall.in')
    // res.setHeader('Access-Control-Allow-Origin','http://localhost:3000')
    res.setHeader('Access-Control-Allow-Headers','Origin, X-Request-With, Content-Type, Accept, Authorization')
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,PUT,DELETE')

    next()
})


app.use('/api/users',userRouter)
app.use('/api/groups',groupRouter)


app.use((req:Request,res:Response,next:Function)=>{
    const error = new HttpError('Route not found',404)
    throw error
})

app.use((error:HttpErrorType,req:Request,res:Response,next:Function)=>{
    if(res.headersSent){
        return next(error)
    }

    res.status(error.errorCode||500)
    res.json({message:error.message||'Unknown error occured'})
})

mongoose
.connect(`mongodb+srv://${process.env.DB_USR}:${process.env.DB_PASS}@cluster0.gmn6g.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
.then(()=>{
    app.listen(process.env.PORT || PORT_NO)
    console.log("Connection successful!")
}).catch((err:Error)=>{
    console.log(err)
})

module.exports = app
