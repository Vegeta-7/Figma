"use client"

import { fabric } from "fabric"
import LeftSideBar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSideBar from "@/components/RightSideBar";
import { useEffect, useRef, useState } from "react";
import { handleCanvasMouseDown, handleCanvasMouseUp, handleCanvasObjectModified, handleCanvasObjectScaling, handleCanvasSelectionCreated, handleCanvaseMouseMove, handlePathCreated, handleResize, initializeFabric, renderCanvas } from "@/lib/canvas";
import { ActiveElement, Attributes } from "@/types/type";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";

export default function Page() {
  const undo = useUndo();
  const redo = useRedo();


  const canvasRef = useRef<HTMLCanvasElement>(null);    //ref to the canvas element to initialize fabric canvas
  const fabricRef = useRef<fabric.Canvas | null>(null);  //ref allows to perform operations on the canvas. This reference will hold the instance of the Fabric.js canvas. Copy of the created canvas so that we can use it outside the canvas eventlisteners.
  const isDrawing = useRef(false);  //check if user is drawing or not
  const shapeRef=useRef<fabric.Object | null>(null);
  const selectedShapeRef=useRef<string | null>(null);   //ref of the shape user has selected
  const activeObjectRef=useRef<fabric.Object | null>(null);
  const imageInputRef=useRef<HTMLInputElement>(null);   //ref to input ele to upload image to the canvas
  const isEditingRef=useRef(false);

  const canvasObjects = useStorage((root) => root.canvasObjects) //allows to store data in key val stores real time by liveblocks

  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: '',
    height: '',
    fontSize: '',
    fontFamily: '',
    fontWeight: '',
    fill: '#aabbcc',
    stroke: '#aabbcc'
  })
  
  // update canvasObjects
  const syncShapeInStorage = useMutation(({ storage },object)=>{
    if(!object){
      return;
    }
    const {objectId} = object;
    // console.log(object)

    const shapeData = object.toJSON();
    shapeData.objectId=objectId;

    const canvasObjects = storage.get('canvasObjects');

    canvasObjects.set(objectId,shapeData);
  },[])

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: '',
    value: '',
    icon: '',
  })

  const deleteAllShapes = useMutation(({storage}) =>{
    const canvasObjects = storage.get('canvasObjects');
    if(!canvasObjects || canvasObjects.size===0) return true;
    
    for (const [key,value] of canvasObjects.entries()){
      canvasObjects.delete(key);
    }

    return canvasObjects.size===0;
  },[])

  const deleteShapeFromStorage = useMutation(({storage},objectId)=>{
    const canvasObjects = storage.get('canvasObjects');
    canvasObjects.delete(objectId);
  },[])

  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem)    

    switch(elem?.value){
      case 'reset':
        deleteAllShapes();
        fabricRef.current?.clear();
        setActiveElement(defaultNavElement)
        break;
      
      case 'delete':
        handleDelete(fabricRef.current as any,deleteShapeFromStorage)  
        setActiveElement(defaultNavElement)
        break;
      
      case 'image':
        imageInputRef.current?.click();  //trigger click event on imput ele
        isDrawing.current=false;
        if(fabricRef.current){
          fabricRef.current.isDrawingMode = false;
        }break;

      default:
        break;
    }

    selectedShapeRef.current=elem?.value as string;
  }

  useEffect(()=>{
    const canvas=initializeFabric({canvasRef,fabricRef})       //The initializeFabric function (not shown here) is responsible for initializing the Fabric.js canvas. It uses the canvasRef to get the HTML canvas element and stores the created Fabric canvas instance in fabricRef.
    canvas.on("mouse:down",(options:any)=>{          //This sets up an event listener for the mouse:down event on the Fabric canvas. Options has properties of the event like clientX, clientY, pointX, pointY, target, etc.
      handleCanvasMouseDown({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef
      })
    })
    
    canvas.on("mouse:up",()=>{          //This sets up an event listener for the mouse:up event on the Fabric canvas. Options has properties of the event like clientX, clientY, pointX, pointY, target, etc.
      handleCanvasMouseUp({        
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
        activeObjectRef,   // to know what element is currently selected in canvas
        })      
    })
    
    canvas.on("mouse:move",(options:any)=>{          //This sets up an event listener for the mouse:move event on the Fabric canvas. Options has properties of the event like clientX, clientY, pointX, pointY, target, etc.
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage
      })
    })

    canvas.on("object:modified",(options : any)=>{    // move an object on canvas live
      handleCanvasObjectModified({
        options,
        syncShapeInStorage
      })
    })

    canvas.on("selection:created",(options: any)=>{
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes
      })        
    })

    canvas.on("object:scaling",(options:any) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes
      })
    })
    
    canvas.on("path:created",(options:any) => {
      handlePathCreated({
        options,
        syncShapeInStorage
      })
    })

    
    window.addEventListener("resize", () => {     //When the window is resized, the handleResize function is called to adjust the Fabric canvas accordingly.
      handleResize({
        canvas: fabricRef.current,
      });      
    });

    window.addEventListener("keydown",(e: any)=>{
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage,
      })
    })

    return () =>{
      canvas.dispose();  // Clean up the canvas when the component unmounts
    }
  },[])

  useEffect(()=>{
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef
    })
  },[canvasObjects])

  return (  
    <main className="h-screen overflow-hidden">   
      <Navbar 
        activeElement={activeElement}
        handleActiveElement={handleActiveElement}
        imageInputRef={imageInputRef}
        handleImageUpload={(e : any)=>{
          e.stopPropagation();  //prevent default behaviour of input ele
          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any, 
            shapeRef,
            syncShapeInStorage
          })
        }}
      />   

      <section className="flex h-full flex-row">
        <LeftSideBar allShapes={Array.from(canvasObjects)}/>
        <Live canvasRef={canvasRef} undo={undo} redo={redo}/>
        
        <RightSideBar
          elementAttributes={elementAttributes}
          setElementAttributes={setElementAttributes}
          fabricRef={fabricRef}
          isEditingRef={isEditingRef}
          activeObjectRef={activeObjectRef}
          syncShapeInStorage={syncShapeInStorage}
        />
      </section>      
    </main>  
  );
}