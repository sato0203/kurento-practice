import * as WebSocketNode from "ws";
import * as http from "http"
import * as https from "https"
import {KurentoWrapperWSMessageToServer, KurentoWrapperWSMessageToFrontend} from "../kurento-wrapper/kurento-wrapper-common"

export type KurentoWrapperServerOption = {
    mediaServerOption:{
        URI:string,//eg)"ws://localhost:8888/kurento"
    }
    clientServerOption:{
        path:string//eg)/websocket
        port:number//eg)12000,
        httpsOption:{
            key:  Buffer//eg)fs.readFileSync('keys/server.key'),
            cert: Buffer//eg)fs.readFileSync('keys/server.crt')
        }
    }
}

export default class KurentoWrapperServer{
    static Kurento:any

    constructor(Kurento:any,private option:KurentoWrapperServerOption){
        KurentoWrapperServer.Kurento = Kurento;
        const self = this;
        var sessionHandler = session({
            secret : 'none',
            rolling : true,
            resave : true,
            saveUninitialized : true
        });

        self.httpsServer = https.createServer(this.option.clientServerOption.httpsOption);
        self.httpsServer.listen(this.option.clientServerOption.port,function(){
            console.log(`Server is listening on port ${self.option.clientServerOption.port}`)
        })
        
        self.webSocketServer = new WebSocketNode.Server({
            "path" : this.option.clientServerOption.path,
            "server" : self.httpsServer
        });
        console.log(this.option.clientServerOption.path)
        console.log(this.option.clientServerOption.port)
        self.webSocketServer.on("connection",function(ws){
            const connectionId = self.getUniqueId();
            console.info(`kurentoWrapper:frontEndConnection:webSocketID = ${connectionId}`)
            ws.on("close",function(){
                self.registeredUsers = self.registeredUsers.filter(x => x.webSocketConnectionId != connectionId)
                console.info(`kurentoWrapper:closeAndUnRegister:webSocketID = ${connectionId}`)
            })
            ws.on("message",function(_message){
                const message = JSON.parse(_message as any) as KurentoWrapperWSMessageToServer
                
                switch(message.method){
                    case "registerWebRtcEndpoint":
                        self.registeredUsers.push(
                            {
                                "webRtcEndpointWrapperId":message.webRtcEndpointWrapperId,
                                "webSocketConnectionId":connectionId
                            }
                        )
                        console.info(`kurentoWrapper:register:webSocketID = ${connectionId}`)
                        break;
                    case "unregisterWebRtcEndpoint":
                        self.registeredUsers = self.registeredUsers.filter(x => x.webSocketConnectionId != connectionId)
                        console.info(`kurentoWrapper:unregister:webSocketID = ${connectionId}`)
                        break;
                    case "sdpOfferToServer":
                        //sdpOfferを返す。
                        console.log("message!!!!!")
                        console.log(message.webRtcEndpointWrapperId)
                        const tgtWebRtcEndpointForSDP = self.registeredWebRtcEndpoint.filter(x => x.webRtcEndpointWrapperId == message.webRtcEndpointWrapperId)[0].webRtcEndpoint;
                        tgtWebRtcEndpointForSDP.rawWebRtcEndpoint.on('OnIceCandidate', function(event:{candidate:any}) {
                            var candidate = Kurento.getComplexType('IceCandidate')(event.candidate);
                            self.sendMessage(ws,{
                                "method":"iceCandidateToFront",
                                "candidate":candidate
                            })
                            console.info(`kurentoWrapper:returnCandidate:webSocketID = ${connectionId}`)
                        });
                        tgtWebRtcEndpointForSDP.rawWebRtcEndpoint.processOffer(message.sdpOffer, (error:any,sdpAnswer:any) => {
                            if(error){
                                throw new Error(error);
                            }
                            const response:KurentoWrapperWSMessageToFrontend = {
                                method:"sdpAnswerToFront",
                                sdpAnswer:sdpAnswer
                            }
                            self.sendMessage(ws,response);
                            console.info(`kurentoWrapper:returnSdp:webSocketID = ${connectionId}`)
                        });
                        tgtWebRtcEndpointForSDP.rawWebRtcEndpoint.gatherCandidates(function(error:any) {
                            if (error) {
                                throw new Error(error);
                            }
                            console.log("gather");
                        });
                        break;
                    case "iceCandidateToServer":
                        const tgtWebRtcEndpointForICE = self.registeredWebRtcEndpoint.filter(x => x.webRtcEndpointWrapperId == message.webRtcEndpointWrapperId)[0].webRtcEndpoint;
                        tgtWebRtcEndpointForICE.rawWebRtcEndpoint.addIceCandidate(message.candidate)
                }
            }) 
        })
        //ToDo
        const expressPath = path.resolve(__dirname, '../frontend')
        app.use(express.static(expressPath));
        console.log(expressPath);
    }

    private getUniqueId = () => {
        this.uniqueIdCount++;
        return this.uniqueIdCount;
    }
    private uniqueIdCount = 0;
    private httpsServer:https.Server;
    private webSocketServer:WebSocketNode.Server;
    private registeredUsers:KurentoWrapperUser[] = []
    private registeredWebRtcEndpoint:KurentoWrapperWebRtcAndId[] = []

    makeClient:() => Promise<KurentoClientWrapper> = async () => {
        const rawClient:any = await new Promise((resolve,reject) => {
            KurentoWrapperServer.Kurento(this.option.mediaServerOption.URI,(error:any,client:any) => {
                if(error){
                    reject(error)
                }
                resolve(client);
            })
        })
        return new KurentoClientWrapper(rawClient);
    }

    public registerWebRtcEndpoint = (rtcAndId:KurentoWrapperWebRtcAndId) => {
        this.registeredWebRtcEndpoint.push(rtcAndId);
        console.dir(this.registeredWebRtcEndpoint);
    }
    private sendMessage(ws:WebSocketNode,message:KurentoWrapperWSMessageToFrontend){
        ws.send(JSON.stringify(message));
    }
}

export class KurentoClientWrapper{
    constructor(private rawClient:any){
        
    }

    create:(moduleWillBeCreated:keyof KurentoClientCreatablesTable) => Promise<KurentoCreatables<keyof KurentoClientCreatablesTable>> = async(moduleWillBeCreated) => {
        const rawMediaPipeline:any = await new Promise((resolve,reject) => {
            this.rawClient.create(moduleWillBeCreated,(error:any,pipeline:any) => {
                if(error){
                    reject(error)
                }
                resolve(pipeline);
            })
        })
        return new KurentoMediaPipelineWrapper(rawMediaPipeline);
    }
}

export class KurentoMediaPipelineWrapper{
    constructor(private rawMediaPipeline:any){
        this.create.bind(this);
    }

    async create<T extends keyof KurentoMediaPipelineCreatablesTable>(moduleWillBeCreated:T):Promise<KurentoCreatables<T>>{
        const rawModule:any = await new Promise((resolve,reject) => {
            this.rawMediaPipeline.create("WebRtcEndpoint",(error:any,pipeline:any) => {
                if(error){
                    reject(error)
                }
                resolve(pipeline);
            })
        })
        switch(moduleWillBeCreated){
            case "WebRtcEndpoint":
                return new KurentoWebRtcEndpointWrapper(rawModule) as any
                break;
            case "RecorderEndpoint":
                return new KurentoRecorderEndpointWrapper(rawModule) as any
                break;
            case "Composite":
                return new KurentoCompositeWrapper(rawModule) as any
                break;
        }
    }
}

//(入力).connect(出力)
export class KurentoConnectingModule<T extends KurentoConnectingModule<T>>{
    constructor(rawModule:any){
        this.rawConnectingModule = rawModule;
    }
    private rawConnectingModule:any

    public connect = async (module:KurentoConnectedModule) => {
        return await new Promise((resolve:(m:T) => void,reject) => {
            this.rawConnectingModule.connect(module.rawConnectedModule,(error:any) => {
                if(error){
                    reject(error)
                }else{
                    console.log("connect OK")
                }
                resolve(this as any);
            })
        })
    }
}


export interface KurentoConnectedModule{
    rawConnectedModule:any
}

export class KurentoWebRtcEndpointWrapper extends KurentoConnectingModule<KurentoWebRtcEndpointWrapper> implements KurentoConnectedModule{
    rawConnectedModule: any;
    constructor(public rawWebRtcEndpoint:any){
        super(rawWebRtcEndpoint);
        this.rawConnectedModule = rawWebRtcEndpoint;
    }
}

export class KurentoRecorderEndpointWrapper extends KurentoConnectingModule<KurentoRecorderEndpointWrapper> implements KurentoConnectedModule{
    rawConnectedModule: any;
    constructor(public rawRecorderEndpoint:any){
        super(rawRecorderEndpoint);
        this.rawConnectedModule = rawRecorderEndpoint;
    }

    public startRecord = () => {
        this.rawRecorderEndpoint.record();
    }
}
export class KurentoCompositeWrapper{
    constructor(public rawComposite:any){

    }
    createHubPort = async () => {
        return new Promise<KurentoHubportWrapper>((resolve,reject) => {
            this.rawComposite.createHubport((error:any,hubPort:any) => {
                if(error)
                    reject(error);
                resolve(hubPort);
            })
        })
    }
}

export class KurentoHubportWrapper extends KurentoConnectingModule<KurentoHubportWrapper> implements KurentoConnectedModule{
    rawConnectedModule: any;
    constructor(private rawHubport:any){
        super(rawHubport)
        this.rawConnectedModule = rawHubport;
    }
}

//type↓

type KurentoClientCreatablesTable = {
    "MediaPipeline" : KurentoMediaPipelineWrapper,
}

type KurentoMediaPipelineCreatablesTable = {
    "WebRtcEndpoint" : KurentoWebRtcEndpointWrapper,
    "RecorderEndpoint" : KurentoRecorderEndpointWrapper,
    "Composite" : KurentoCompositeWrapper,
}

type KurentoCreatablesTable = KurentoClientCreatablesTable & KurentoMediaPipelineCreatablesTable

type PickUpParameter<T,U extends string> = T extends { [K in U]: infer I } ? I : never
type KurentoCreatables<T extends keyof KurentoCreatablesTable> = PickUpParameter<KurentoCreatablesTable,T>;

type KurentoWrapperUser = {
    webRtcEndpointWrapperId :string//WebRTCEndpointごとに一意に決めるID,サーバー側でWebRtcEndpointWrapperをKurentoWrapperServerに登録することで設定
    webSocketConnectionId:number//webSocketの接続ごとに一意に決まるID
}

type KurentoWrapperWebRtcAndId = {
    webRtcEndpointWrapperId:string,//WebRTCEndpointごとに一意に決めるID,サーバー側でWebRtcEndpointWrapperをKurentoWrapperServerに登録することで設定
    webRtcEndpoint:KurentoWebRtcEndpointWrapper
}