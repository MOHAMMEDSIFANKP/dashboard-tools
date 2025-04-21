import { Post } from "@/types/Schemas";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({baseUrl: 'https://jsonplaceholder.typicode.com/'}),
    endpoints: (builder) => ({
        // Fetch list of posts
        getPosts: builder.query<Post[], void>({
            query: () => "posts",
          }),
        // Fetch single post by ID
        getPostById: builder.query<Post, number>({
            query: (id) => `posts/${id}`,
        }),
        createPost: builder.mutation<Post, Partial<Post>>({
            query: (newPost) => ({
                url: 'posts',
                method: 'POST',
                body: newPost,
            }),
        }),
    }),
    // overrideExisting: false,
})

export const {
    useGetPostsQuery,
    useGetPostByIdQuery,
    useCreatePostMutation,
} = api