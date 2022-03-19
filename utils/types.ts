export type User = {
    id:string,
    email:string,
    fullName:string,
    groups:GroupState[],
    forks:PostState[],
    todos:Todo[]
}

export type GroupState = {
    id:string,
    creatorId:string,
    members:User[],
    groupName: string,
    // groupAdmin: string
}

export type PostState = {
    id:string,
    creatorId:string,
    creatorName:string
    groupId: string,
    comments:[],
    description:string,
    storage:{
        location:string,
        name:string
    }|null,
    postTitle:string
}

export type Todo = {
    todoId:string,
    todoTitle:string,
    todoDescription:string
}

export type HttpErrorType = {
    errorCode:number,
    message:string

}