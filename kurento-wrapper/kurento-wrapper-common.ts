
//Server → Client

export type KurentoWrapperWSMessageToFrontend 
= SdpAnswerToFrontMessage |
  IceCandidateToFrontMessage

type SdpAnswerToFrontMessage = {
    method:"sdpAnswerToFront",
    sdpAnswer:any
}

type IceCandidateToFrontMessage = {
    method:"iceCandidateToFront",
    candidate:any
}


//Client → Server

export type KurentoWrapperWSMessageToServer
 = SdpOfferToServerMessage |
   IceCandidateToServerMessage |
   RegisterWebRtcEndpointMessage |
   UnRegisterWebRtcEndpointMessage
    

type SdpOfferToServerMessage = {
    method:"sdpOfferToServer",
    webRtcEndpointWrapperId : string,
    sdpOffer : any
}

type IceCandidateToServerMessage = {
    method:"iceCandidateToServer",
    webRtcEndpointWrapperId : string,
    candidate:any
}

type RegisterWebRtcEndpointMessage = {
    method:"registerWebRtcEndpoint",
    webRtcEndpointWrapperId:string
}

type UnRegisterWebRtcEndpointMessage = {
    method:"unregisterWebRtcEndpoint",
    webRtcEndpointWrapperId:string
}