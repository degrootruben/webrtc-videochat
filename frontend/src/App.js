import io from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";

const App = () => {
  const [ID, setID] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [users, setUsers] = useState({});

  const [beingCalled, setBeingCalled] = useState(false);
  const [receivingSignal, setReceivingSignal] = useState(null);
  const [caller, setCaller] = useState("");

  const socket = useRef();
  const localVideo = useRef();
  const remoteVideo = useRef();
  const peerConnection = useRef();

  const callUser = (userToCall) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream
    });

    peer.on("signal", signal => {
      socket.current.emit("callUser", { userToCall, signal, from: ID});
    });

    peer.on("stream", stream => {
      remoteVideo.current.srcObject = stream;
    });

    socket.current.on("callAccepted", data => {
      console.log(data);
      if (data.signal) {

        setCallAccepted(true);
        peer.signal(data.signal);
      }
    });

    peerConnection.current = peer;
  }

  const acceptCall = () => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream
    });

    setBeingCalled(false);
    setCallAccepted(true);
    peer.signal(receivingSignal);

    peer.on("signal", signal => {
      socket.current.emit("sendAnswer", { to: caller, signal });
    });

    peer.on("stream", stream => {
      remoteVideo.current.srcObject = stream;
    });

    peerConnection.current = peer;
  }

  const endCall = () => {
    peerConnection.current.destroy();
    setCallAccepted(false);
  }

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      socket.current = io.connect("http://localhost:5000");
    } else if (process.env.NODE_ENV === "production") {
      socket.current = io.connect();
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (stream) {
        setLocalStream(stream);
        localVideo.current.srcObject = stream;
      }
    }).catch(error => {
      console.error(error);
    });

    socket.current.on("yourID", ID => {
      if (ID) {
        setID(ID);
      }
    });

    socket.current.on("updateUsers", connectedUsers => {
      setUsers(connectedUsers);
    });

    socket.current.on("userCalling", data => {
      if (data) {
        setBeingCalled(true);
        setCaller(data.from);
        setReceivingSignal(data.signal);
      }
    });
  }, []);

  return (
    <div className="App">
      { localStream && <video playsInline muted autoPlay ref={localVideo} style={{width: "50vw"}}/>}
      { callAccepted && <video playsInline autoPlay ref={remoteVideo} style={{width: "50vw"}}/>}
      { !callAccepted && !beingCalled && Object.keys(users).map(user => {
        if (user === ID) {
          return null;
        } else {
          return (<button onClick={() => callUser(user)}>Call {user}</button>);
        }
      })}
      { beingCalled && <button onClick={acceptCall}>Click to accept call from {caller}</button>}
      { callAccepted && <button onClick={endCall}>End call</button>}
    </div>
  );
}

export default App;