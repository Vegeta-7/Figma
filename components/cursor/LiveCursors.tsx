import { useOthers } from '@/liveblocks.config';
import Cursor from './Cursor';
import { COLORS } from '@/constants';

const LiveCursors = () => {      
  const others = useOthers();   // extracts data(positioning of their cursor) and returns list of all users in the room    
  // console.log(others)
  return (
    others.map(({connectionId,presence})=>{
      if(!presence?.cursor){
        return null;
      }      
      return (        
        <Cursor 
          key={connectionId}
          color={COLORS[Number(connectionId) % COLORS.length]}        
          x={presence.cursor.x}
          y={presence.cursor.y}
          message={presence.message || ''}
        />        
      )
    }) 
  ) 
}

export default LiveCursors