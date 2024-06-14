import { useBroadcastEvent, useEventListener, useMyPresence } from "@/liveblocks.config"
import LiveCursors from "./cursor/LiveCursors"
import { useCallback, useEffect, useState } from "react";
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction } from "@/types/type";
import ReactionSelector from "./Reaction/ReactionButton";
import FlyingReaction from "./Reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";
import { Comments } from "./comments/Comments";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
  } from "@/components/ui/context-menu"
import { shortcuts } from "@/constants";



type Props = {
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
    undo: () => void;
    redo: () => void;
}

// collection of live functionalities livecursor etc.
const Live = ({canvasRef, undo, redo}:Props) => {
    const [{ cursor }, updateMyPresence] = useMyPresence();   //Returns the presence of the current user of the current room, and a function to update it
    const [cursorState, setcursorState] = useState<CursorState>({
        mode: CursorMode.Hidden,
    })
    const [reaction, setReaction] = useState<Reaction[]>([])
    
    const broadcast = useBroadcastEvent();    

    useInterval(() => {
        setReaction((reaction) => reaction.filter((r) => r.timestamp > Date.now() - 4000))
    },1000)

    useInterval(() => {
        if(cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor){
            setReaction((reactions) => 
                reactions.concat([
                    {
                        point: {x: cursor.x, y: cursor.y },
                        value: cursorState.reaction,
                        timestamp: Date.now(),
                    }
                ])
            )
            broadcast({
                x:cursor.x,
                y:cursor.y,
                value: cursorState.reaction,
            })
        }
    },100);

    //gets fired every time event gets broadcasted
    useEventListener((eventData) => {
        const event=eventData.event;
        
        setReaction((reactions) => 
            reactions.concat([
                {
                    point: {x: event.x, y: event.y },
                    value: event.value,
                    timestamp: Date.now(),
                }
            ])
        )
    })

    useEffect(()=>{         //keep track of keyboard events
        const onKeyUp = (e:KeyboardEvent) => {
            if(e.key === '/'){
                setcursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: '',
                })
            }else if(e.key==='Escape'){
                updateMyPresence({message: ''})
                setcursorState({
                    mode: CursorMode.Hidden
                })
            }else if(e.key==='e'){
                setcursorState({
                    mode: CursorMode.ReactionSelector,
                })
            }
        }
        const onKeyDown = (e:KeyboardEvent) => {
            if(e.key === '/'){
                e.preventDefault();
            }
        }
        window.addEventListener('keyup',onKeyUp);
        window.addEventListener('keydown',onKeyDown);

        return ()=>{
            window.removeEventListener('keyup',onKeyUp);
            window.removeEventListener('keydown',onKeyDown);
        }

    },[updateMyPresence])

    const setReactions = useCallback((reaction:string) => {           
        setcursorState({
            mode: CursorMode.Reaction,
            reaction,
            isPressed: false
        })   
        // console.log(1)         
    },[])

    // Triggered when a pointer (e.g., mouse, touch, stylus) moves within the element.
    const handlePointerMove = useCallback((event: React.PointerEvent) => {    //useCallback will return a memoized version of the callback that only changes if one of the inputs has changed.
        event.preventDefault();

        if(!cursor || cursorState.mode !== CursorMode.ReactionSelector){

            // event.clientX gives the horizontal coordinate of the mouse pointer relative to the viewport.
            // event.currentTarget.getBoundingClientRect().x gives the horizontal coordinate of the top-left corner of the element that triggered the event relative to the viewport.
            const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
            const y = event.clientY - event.currentTarget.getBoundingClientRect().y;
            
            updateMyPresence({ cursor: { x,y } });
        }
    },[])


    // Triggered when a pointer (e.g., mouse, touch, stylus) leaves the element.
    const handlePointerLeave = useCallback((event: React.PointerEvent) => {    //useCallback will return a memoized version of the callback that only changes if one of the inputs has changed.
        setcursorState({mode: CursorMode.Hidden})        
        updateMyPresence({ cursor: null, message: null });        
    },[])    


    // Triggered when a pointer button is released over the element.
    const handlePointerUp = useCallback((event: React.PointerEvent) => {
        setcursorState((state: CursorState) => cursorState.mode === CursorMode.Reaction ? {...state, isPressed: true} : state);                        
        // console.log("UP")
    },[cursorState.mode,setcursorState])


    // Triggered when a pointer button is pressed over the element.
    const handlePointerDown = useCallback((event: React.PointerEvent) => {    //useCallback will return a memoized version of the callback that only changes if one of the inputs has changed.        
        // event.clientX gives the horizontal coordinate of the mouse pointer relative to the viewport.
        // event.currentTarget.getBoundingClientRect().x gives the horizontal coordinate of the top-left corner of the element that triggered the event relative to the viewport.
        const x=event.clientX - event.currentTarget.getBoundingClientRect().x;
        const y=event.clientY - event.currentTarget.getBoundingClientRect().y;
        
        updateMyPresence({ cursor: { x,y } });

        setcursorState((state: CursorState) => cursorState.mode === CursorMode.Reaction ? {...state, isPressed: true} : state);        
        // console.log("down")
    },[])    


    // console.log(others)

    const handleContextMenuClick = useCallback((key : string) => {
        switch (key) {
            case 'Chat':
                setcursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: '',
                })
                break;
            case 'Undo':
                undo();
                break;
            case 'Redo':
                redo();
                break; 
            case 'Reactions':
                setcursorState({
                    mode: CursorMode.ReactionSelector,                    
                })
                break;                            
            default:
                break;
        }     
    },[])

    return (
        <ContextMenu>  
            <ContextMenuTrigger
                id="canvas"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                className="h-[100vh] w-full flex justify-center items-center text-center"
            >
                <canvas ref={canvasRef}/>

                {reaction.map((r) => (
                    <FlyingReaction
                        key={r.timestamp.toString()}
                        x={r.point.x}
                        y={r.point.y}
                        timestamp={r.timestamp}
                        value={r.value}
                    />
                ))}

                {cursor && (
                    <CursorChat cursor={cursor} cursorState={cursorState} setCursorState={setcursorState} updateMyPresence={updateMyPresence}/>
                )}

                {cursorState.mode===CursorMode.ReactionSelector && (
                    <ReactionSelector setReaction={setReactions}/>
                )}

                <LiveCursors/>
                <Comments />
            </ContextMenuTrigger>

            <ContextMenuContent className="right-menu-content">
                {shortcuts.map((item)=>(
                    <ContextMenuItem key={item.key} onClick={() => handleContextMenuClick(item.name)} className="right-menu-item">
                        <p>{item.name}</p>    
                        <p className="text-xs text-primary-grey-300">{item.shortcut}</p>                 
                    </ContextMenuItem>
                ))}
            </ContextMenuContent>
        </ContextMenu>
    )
}

export default Live