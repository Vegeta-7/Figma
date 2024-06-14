// We’ll add useThreads to get the threads in the room, then we’ll use the Thread component to render them. Finally, we’ll add a way to create threads by adding a Composer.
"use client";

import { useThreads } from "@/liveblocks.config";
import { Composer, Thread } from "@liveblocks/react-comments";

export function CommentsOverlay() {
  const { threads } = useThreads();

  return (
    <div>
      {/* {threads.map((thread) => (
        <Thread key={thread.id} thread={thread} />
      ))} */}
      {/* <Composer /> */}   {/* should be shown after a specific click */}
    </div>
  );
}