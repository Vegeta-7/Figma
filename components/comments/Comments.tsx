import { ClientSideSuspense } from '@liveblocks/react'
import React from 'react'
import { CommentsOverlay } from './CommentsOverlay'

export const Comments = () => (  
    // This pattern ensures CommentsOverlay is rendered once the suspense (e.g., fetching threads in commentsOverlay) is resolved.
    <ClientSideSuspense fallback={null}>   
        {() => <CommentsOverlay />}
    </ClientSideSuspense>
);