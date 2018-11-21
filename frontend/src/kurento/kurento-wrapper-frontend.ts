import * as KurentoOrigin from "kurento-utils";
import { KurentoWrapperWSMessageToServer, KurentoWrapperWSMessageToFrontend } from "../../../kurento-wrapper/kurento-wrapper-common";

declare const kurentoUtils:typeof KurentoOrigin

export type KurentoFrontendWrapperOptionType = {
    videoElementForSend : HTMLVideoElement,
    videoElementForReceive : HTMLVideoElement,
    serverWrapperURI : string,//eg)//'wss://' + location.host + '/helloworld'
    webRtcEndpointId :string ,//Server側で作ったwebRtcEndpointに対応させるIDをつける。
}

type KurentoUtilOption = {
    localVideo? : HTMLVideoElement,
    remoteVideo? : HTMLVideoElement,
    oniceecandidate : (candidate:any) => void
}

export default class KurentoFrontendWrapper{
    constructor(private option:KurentoFrontendWrapperOptionType){
        this.webRtcEndpointWrapperId = option.webRtcEndpointId;
        this.webSocketClient = new WebSocket(option.serverWrapperURI);
        this.webSocketClient.onmessage = (_message) => {
            const message:KurentoWrapperWSMessageToFrontend = JSON.parse(_message.data);
            console.info("message from server ...")
            console.info(message);
            switch(message.method){
                case "sdpAnswerToFront":
                    this.webRtcPeer.processAnswer(message.sdpAnswer);
                    break;
                case "iceCandidateToFront":
                    this.webRtcPeer.addIceCandidate(message.candidate);
                    break;
            }
        }
    }

    private webSocketClient:WebSocket;
    private webRtcEndpointWrapperId:string
    private webRtcPeer:any;

    private registerToWebRtcEndpoint = (webRtcEndpointWrapperId:string) => {
        if(webRtcEndpointWrapperId != undefined){
            this.sendMessage({
                method:"unregisterWebRtcEndpoint",
                webRtcEndpointWrapperId:webRtcEndpointWrapperId
            })
        }
        this.sendMessage({
            method:"registerWebRtcEndpoint",
            webRtcEndpointWrapperId:webRtcEndpointWrapperId
        })
    }
    
    public startSendAndReceive = () =>{
        const self = this;
        const utilOption:KurentoUtilOption = {
            "localVideo" : this.option.videoElementForSend,
            "remoteVideo" : this.option.videoElementForReceive,
            "oniceecandidate" : function(candidate){self.onIceCandidate(candidate)}
        }
        self.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(utilOption,function(error:any){
            if (error) {
                console.error(error);
            }

            this.generateOffer(function(error:any, offerSdp:any) {
                if (error) {
                    console.error(error);
                }
                self.sendMessage({
                    method:"sdpOfferToServer",
                    webRtcEndpointWrapperId : self.webRtcEndpointWrapperId,
                    sdpOffer : offerSdp
                });
            });
        })
    }

    private onIceCandidate = (candidate:any) => {
        console.log("on ice candidate!")
        this.sendMessage({
            "method":"iceCandidateToServer",
            "webRtcEndpointWrapperId":this.webRtcEndpointWrapperId,
            "candidate":candidate
        });
    }

    private sendMessage = (message:KurentoWrapperWSMessageToServer) => {
        console.log(`sendmessage:${message.method}`)
        const jsonMessage = JSON.stringify(message);
        this.webSocketClient.send(jsonMessage);
    }
}