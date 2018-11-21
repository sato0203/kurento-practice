import * as fs from "fs";
import KurentoWrapper from "./kurneto-wrapper-server"

export function run(Kurento:any){
    const wrapper = new KurentoWrapper(
        Kurento,{
        "clientServerOption":{
            "httpsOption":{
                "cert":fs.readFileSync('keys/server.crt'),
                "key" :fs.readFileSync('keys/server.key')
            },
            "path":"/websocket",
            "port":12000
        },
        "mediaServerOption":{
            "URI": "ws://localhost:8888/kurento"
        }
    })
    makePipeline(wrapper).then(x => {
        console.log("kurento has started");
    });
}

async function makePipeline(wrapper:KurentoWrapper){

    //まずパイプラインを作っていく。
    const client = await wrapper.makeClient();
    const mediaPipeline = await client.create("MediaPipeline");
    const webRtcEndpoint = await mediaPipeline.create("WebRtcEndpoint");
    webRtcEndpoint.connect(webRtcEndpoint);

    //フロントエンドと紐付けるために、WebRtcEndpointと対応する文字列を紐付ける。
    //(WebRtcEndpointWrapperIDでフロントエンドとやりとりする。)
    wrapper.registerWebRtcEndpoint({
        "webRtcEndpoint":webRtcEndpoint,
        "webRtcEndpointWrapperId":"test"
    })
}