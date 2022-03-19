export type User = {
    name:string,
    userId:string,
    groups:GroupState[],
    forks:PostState[],
    todos:Todo[]
}

export type GroupState = {
    groupId:string,
    creatorId:string,
    members:User[],
    groupName: string,
    // groupAdmin: string
}

export type PostState = {
    postId:string,
    creatorId:string,
    groupId: string,
    comments:[],
    description:string,
    cdn_link:string,
    postTitle:string
}

export type Todo = {
    todoId:string,
    todoTitle:string,
    todoDescription:string
}