import * as React from "react";
import * as ReactDOM from "react-dom";
import KurentoWrapper from "./kurento-wrapper-frontend";

type KurentoUtilOption = {
    localVideo? : HTMLVideoElement,
    remoteVideo? : HTMLVideoElement,
    onicecandidate : (candidate:any) => void
}

class KurentoComponent extends React.PureComponent{
    componentDidMount(){
        this.kurento = new KurentoWrapper({
            webRtcEndpointId:"test",
            serverWrapperURI:"wss://127.0.0.1:12000/websocket",
            videoElementForSend:document.getElementById("videoInput") as HTMLVideoElement,
            videoElementForReceive : document.getElementById("videoOutput") as HTMLVideoElement
        })
    }

    private kurento:KurentoWrapper;

    private connectToKurento = () => {
        this.kurento.startSendAndReceive();
    }

    render = () => (
        <div>
            <button onClick = {() => this.connectToKurento()}>{"start"}</button>
            <div>
                <video id="videoOutput" autoPlay width="640px" height="480px"></video>
            </div>
            <div>
                <video id="videoInput" autoPlay width="240px" height="180px"></video>
            </div>
        </div>
    )
}


ReactDOM.render(<KurentoComponent />,document.getElementById("kurento"));
