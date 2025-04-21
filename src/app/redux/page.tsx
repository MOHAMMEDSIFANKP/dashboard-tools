"use client";
import { RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { increment, decrement } from "@/store/slices/counterSlice";
import { useGetPostsQuery } from "@/lib/services/usersApi";
import { Post } from "@/types/Schemas";
export default function Redux() {
  const counter = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();

  // RTK QUERY
  const { data, error, isLoading } = useGetPostsQuery();

  if (isLoading) return <p>Loading users...</p>;
  if (error) return <p>Failed to load users.</p>;
  return (
    <section className="h-screen w-full p-[30px] flex flex-col gap-4">
      <h1 className="text-center font-bold text-[22px] capitalize">
        Redux implementation
      </h1>
      <div className="flex flex-row gap-2 items-center">
        <button
          onClick={() => dispatch(increment())}
          className="cursor-pointer bg-green-400 text-white p-2 font-bold rounded-xl"
        >
          Increment
        </button>
        <p className="f">Counter : {counter}</p>
        <button
          onClick={() => dispatch(decrement())}
          className="cursor-pointer bg-red-500 text-white p-2 font-bold rounded-xl"
        >
          Increment
        </button>
      </div>
      <div className="p-6">
        <h2 className="text-center font-bold text-[22px] capitalize">
          RTK Query Post Listing
        </h2>
        <ul className="space-y-4">
          {data?.map((post: Post) => (
            <li key={post.id} className="p-4 border rounded shadow">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-gray-700">{post.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
