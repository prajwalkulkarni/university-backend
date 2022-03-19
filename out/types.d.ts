export declare type User = {
    name: string;
    userId: string;
    groups: GroupState[];
    forks: PostState[];
    todos: Todo[];
};
export declare type GroupState = {
    groupId: string;
    creatorId: string;
    members: User[];
    groupName: string;
};
export declare type PostState = {
    postId: string;
    creatorId: string;
    groupId: string;
    comments: [];
    description: string;
    cdn_link: string;
    postTitle: string;
};
export declare type Todo = {
    todoId: string;
    todoTitle: string;
    todoDescription: string;
};
//# sourceMappingURL=types.d.ts.map