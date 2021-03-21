import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import { Grid, Button, TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import "@fontsource/roboto";

const useStyles = makeStyles((theme) => ({
  content: {
    boxShadow: "2px 2px 10px #b0b0b0",
    marginTop: "10px",
    padding: "10px",
    background: "#242424",
  },

  info: {
    display: "inline-block",
    margin: "10px",
    border: "1px solid white",
    padding: "5px",
    color: "white"
  },

  infoSection: {
    textAlign: "center",
  },

  inputSection: {
    marginTop: "10px",
    marginBottom: "10px"
  },

  inputField: {
    color: "white",
    textColor: "white"
  },

  button: {
    color: "white",
    marginLeft: "5px"
  }
}));

function App() {
  const classes = useStyles();

  const socket = io.connect("http://localhost:5000");

  const [ownId, setOwnId] = useState(null);
  const [hasLocalStream, setHasLocalStream] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [localStream, setLocalStream] = useState(null);

  const localVideo = useRef();
  const remoteVideo = useRef();
  const connection = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setLocalStream(stream);
      setHasLocalStream(true);
      localVideo.current.srcObject = stream;
    });

    socket.on("setId", (socketId) => {
      console.log(socketId);
      setOwnId(socketId);
    });

    socket.on("userCalling", data => {
      console.log("someone wants to call u");
      answerCall(data);
    });
  }, []);

  const callUser = () => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: localStream
    });

    peer.on("signal", data => {
      console.log("calling user");
      socket.emit("callUser", { offer: data, idToCall, from: ownId });
    });

    peer.on("stream", (stream) => {
      console.log("stream received");
      setHasRemoteStream(true);
      remoteVideo.current.srcObject = stream;
    });

    socket.on("callAccepted", (answer) => {
      console.log("call accepted");
      peer.signal(answer);
    });

    connection.current = peer;
  }

  const answerCall = (data) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: localStream
    });

    console.log(data.offer);
    peer.signal(data.offer);

    peer.on("signal", answer => {
      console.log("trying to send answer!");
      socket.emit("answerSent", { answer, from: data.from });
    });

    peer.on("stream", stream => {
      console.log("stream received");
      setHasRemoteStream(true);
      remoteVideo.current.srcObject = stream;
    });
  }

  const handleClick = (e) => {
    e.preventDefault();
    if (idToCall !== "" && idToCall !== " " && idToCall !== null && idToCall !== undefined) {
      callUser();
    }
  }

  return (
    <div className="App">
      <Grid className={classes.content} container>
        <Grid className={classes.infoSection} item xs={12}><span className={classes.info}>ID: {ownId}</span></Grid>
        <Grid item xs={6}>
          {hasLocalStream &&
            <video ref={localVideo} muted playsInline autoPlay style={{
              width: "100%",
              height: "auto",
            }} />
          }
        </Grid>
        <Grid item xs={6}>
          {hasRemoteStream &&
            <video ref={remoteVideo} playsInline autoPlay style={{
              width: "100%",
              height: "auto"
            }} />
          }
        </Grid>
        <Grid className={classes.inputSection} container item xs={12}>
          <Grid item xs={4}>
            <TextField
              className={classes.inputField}
              placeholder="Id of user to call"
              value={idToCall}
              onChange={e => setIdToCall(e.target.value)}
              fullWidth
              />
          </Grid>
          <Grid item xs={2}>
            <Button
              className={classes.button}
              variant="outlined"
              onClick={handleClick}
              style={{
                width: "100%"
              }}
            >Submit</Button>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );

}

export default App;
