"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from "lucide-react";
import { cn } from "@/lib/utils";

type CallStatus = "idle" | "calling" | "incoming" | "connected" | "ended";

interface VideoCallModalProps {
  currentUser: { email: string; name: string; photo?: string };
  activeContact: { id: string; name: string; image?: string } | null;
  isOpen: boolean;
  onClose: () => void;
  isIncoming?: boolean; // Se true, abre já no estado de recebendo
  incomingCallData?: any; // Dados da chamada recebida
  mode?: "video" | "audio";
}

export function VideoCallModal({ currentUser, activeContact, isOpen, onClose, isIncoming = false, incomingCallData, mode = "video" }: VideoCallModalProps) {
  const [status, setStatus] = useState<CallStatus>(isIncoming ? "incoming" : "idle");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(mode === "video");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const signaling = useRef<BroadcastChannel | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  const endCall = useCallback((notify = true) => {
    if (notify && (status === "calling" || status === "connected")) {
      signaling.current?.postMessage({
        type: "end_call",
        sender: currentUser.email,
        target: isIncoming ? incomingCallData?.sender : activeContact?.id
      });
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    localStream.current = null;
    peerConnection.current = null;
    setStatus("ended");

    setTimeout(() => {
      onClose();
    }, 1000);
  }, [status, currentUser.email, isIncoming, incomingCallData?.sender, activeContact?.id, onClose]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" } // Servidor STUN público do Google
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.current?.postMessage({
          type: "candidate",
          sender: currentUser.email,
          target: isIncoming ? incomingCallData?.sender : activeContact?.id,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        endCall(false);
      }
      if (pc.connectionState === "connected") {
        setStatus("connected");
      }
    };

    peerConnection.current = pc;
  }, [endCall, currentUser.email, isIncoming, incomingCallData?.sender, activeContact?.id]);

  const startCall = useCallback(async () => {
    if (!activeContact) return;
    setStatus("calling");

    try {
      const constraints = {
        audio: true,
        video: mode === "video"
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStream.current = stream;
      if (localVideoRef.current && mode === "video") localVideoRef.current.srcObject = stream;

      createPeerConnection();

      stream.getTracks().forEach(track => {
        if (localStream.current && peerConnection.current) {
          peerConnection.current.addTrack(track, localStream.current);
        }
      });

      const offer = await peerConnection.current!.createOffer();
      await peerConnection.current!.setLocalDescription(offer);

      signaling.current?.postMessage({
        type: "offer",
        sender: currentUser.email,
        senderName: currentUser.name,
        senderImage: currentUser.photo,
        target: activeContact.id,
        sdp: offer
      });

    } catch (err) {
      console.error("Erro ao iniciar chamada:", err);
      alert("Não foi possível acessar câmera/microfone.");
      endCall();
    }
  }, [activeContact, currentUser.email, currentUser.name, currentUser.photo, mode, createPeerConnection, endCall]);

  const acceptCall = useCallback(async () => {
    if (!incomingCallData) return;
    setStatus("connected");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      createPeerConnection();

      stream.getTracks().forEach(track => {
        if (localStream.current && peerConnection.current) {
          peerConnection.current.addTrack(track, localStream.current);
        }
      });

      await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(incomingCallData.sdp));

      const answer = await peerConnection.current!.createAnswer();
      await peerConnection.current!.setLocalDescription(answer);

      signaling.current?.postMessage({
        type: "answer",
        sender: currentUser.email,
        target: incomingCallData.sender,
        sdp: answer
      });

    } catch (err) {
      console.error("Erro ao aceitar chamada:", err);
      endCall();
    }
  }, [incomingCallData, currentUser.email, createPeerConnection, endCall]);

  useEffect(() => {
    signaling.current = new BroadcastChannel("spicy_signaling");

    signaling.current.onmessage = async (event) => {
      const data = event.data;

      if (data.sender === currentUser.email) return;
      if (data.target !== currentUser.email) return;

      console.log("Sinalização recebida:", data.type);

      try {
        if (data.type === "answer" && status === "calling") {
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          }
        } else if (data.type === "candidate" && (status === "calling" || status === "connected")) {
          if (peerConnection.current && data.candidate) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        } else if (data.type === "end_call") {
          endCall(false);
        }
      } catch (err) {
        console.error("Erro na sinalização:", err);
      }
    };

    return () => {
      signaling.current?.close();
    };
  }, [currentUser.email, status, endCall]);

  useEffect(() => {
    if (isOpen && !isIncoming && status === "idle") {
      startCall();
    }
  }, [isOpen, isIncoming, status, startCall]);

  const toggleMic = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] bg-black p-0 border-gray-800 overflow-hidden flex flex-col">
        {/* Status Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
               <Avatar className="h-10 w-10 border-2 border-white/20">
                 <AvatarImage src={isIncoming ? incomingCallData?.senderImage : activeContact?.image} />
                 <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
               </Avatar>
               <div>
                 <h3 className="font-bold text-lg drop-shadow-md">
                   {isIncoming ? incomingCallData?.senderName : activeContact?.name}
                 </h3>
                 <p className="text-sm text-gray-300 drop-shadow-md flex items-center gap-2">
                   {status === "calling" && "Chamando..."}
                   {status === "incoming" && "Chamada recebida..."}
                   {status === "connected" && <span className="text-green-400">● Conectado</span>}
                   {status === "ended" && <span className="text-red-400">Chamada encerrada</span>}
                 </p>
               </div>
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
          {/* Remote Video (Full Screen) */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Placeholder if no video */}
          {(!remoteVideoRef.current?.srcObject) && status === "connected" && (
             <div className="absolute inset-0 flex items-center justify-center">
                <Avatar className="h-32 w-32 opacity-50">
                  <AvatarImage src={isIncoming ? incomingCallData?.senderImage : activeContact?.image} />
                  <AvatarFallback><User className="h-16 w-16" /></AvatarFallback>
                </Avatar>
             </div>
          )}

          {/* Local Video (PiP) */}
          {(status === "calling" || status === "connected") && (
            <div className="absolute bottom-24 right-4 w-32 h-48 bg-black border border-gray-700 rounded-lg overflow-hidden shadow-xl z-20">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className={cn("w-full h-full object-cover mirror-mode", !isVideoOn && "hidden")}
              />
              {!isVideoOn && (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                  <VideoOff className="h-8 w-8" />
                </div>
              )}
            </div>
          )}

          {/* Incoming Call Overlay */}
          {status === "incoming" && (
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-8 animate-in fade-in">
                <Avatar className="h-32 w-32 border-4 border-primary-500 animate-pulse">
                  <AvatarImage src={incomingCallData?.senderImage} />
                  <AvatarFallback><User className="h-16 w-16" /></AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">{incomingCallData?.senderName}</h2>
                  <p className="text-gray-400">está ligando para você...</p>
                </div>
                <div className="flex gap-8">
                  <Button 
                    size="lg" 
                    className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
                    onClick={() => endCall(true)}
                  >
                    <PhoneOff className="h-8 w-8" />
                  </Button>
                  <Button 
                    size="lg" 
                    className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 animate-bounce"
                    onClick={acceptCall}
                  >
                    <Phone className="h-8 w-8" />
                  </Button>
                </div>
             </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent z-20">
          <div className="flex justify-center items-center gap-6">
            <Button 
              variant={isMicOn ? "secondary" : "destructive"} 
              size="icon" 
              className="h-12 w-12 rounded-full"
              onClick={toggleMic}
              disabled={status !== "connected" && status !== "calling"}
            >
              {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>
            
            <Button 
              variant="destructive" 
              size="icon" 
              className="h-16 w-16 rounded-full shadow-lg hover:scale-105 transition-transform"
              onClick={() => endCall(true)}
            >
              <PhoneOff className="h-8 w-8" />
            </Button>

            <Button 
              variant={isVideoOn ? "secondary" : "destructive"} 
              size="icon" 
              className="h-12 w-12 rounded-full"
              onClick={toggleVideo}
              disabled={status !== "connected" && status !== "calling"}
            >
              {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
