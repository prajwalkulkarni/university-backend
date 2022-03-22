export declare type User = {
    id: string;
    email: string;
    fullName: string;
    groups: GroupState[];
    forks: PostState[];
    todos: Quicknote[];
};
export declare type GroupState = {
    id: string;
    creatorId: string;
    members: User[];
    groupName: string;
};
export declare type PostState = {
    id: string;
    creatorId: string;
    creatorName: string;
    groupId: string;
    comments: [];
    description: string;
    storage: {
        location: string;
        name: string;
    } | null;
    postTitle: string;
};
export declare type Quicknote = {
    id: string;
    title: string;
    description: string;
};
export declare type HttpErrorType = {
    errorCode: number;
    message: string;
};
//# sourceMappingURL=types.d.ts.map