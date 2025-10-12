const socket = io();

// Elements
const chatform = document.querySelector("#chatform");
const messagebox = document.querySelector("#messagebox");
const messagecontainer = document.querySelector("#message-container");
const typingIndicator = document.querySelector("#typing-indicator");
const nextBtn = document.querySelector("#next-btn");
const videoCallBtn = document.querySelector("#video-call-btn");
const videoblock = document.querySelector(".videoblock");
const localVideo = document.querySelector("#localVideo");
const remoteVideo = document.querySelector("#remoteVideo");

let room, localStream, peerConnection;
const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// Join random room
socket.emit("joinroom");
socket.on("joined", (roomName) => {
  room = roomName;
  document.querySelector(".nobody").classList.add("hidden");
  messagecontainer.innerHTML = "";
});

// Chat messages
socket.on("message", (msg) => addMessage(msg, "left"));

// Typing indicator
messagebox.addEventListener("input", () => {
  socket.emit("typing", { room, user: "Stranger is typing..." });
});

socket.on("typing", (msg) => {
  typingIndicator.textContent = msg;
  setTimeout(() => (typingIndicator.textContent = ""), 2000);
});

// Next stranger
nextBtn.addEventListener("click", () => socket.emit("nextStranger"));
socket.on("resetChat", () => {
  messagecontainer.innerHTML = "";
  document.querySelector(".nobody").classList.remove("hidden");
});

// Send messages
chatform.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!messagebox.value) return;
  addMessage(messagebox.value, "right");
  socket.emit("message", { room, message: messagebox.value });
  messagebox.value = "";
});

function addMessage(msg, side) {
  const div = document.createElement("div");
  div.classList.add("my-2", "p-3", "rounded-lg", "max-w-xs");
  div.classList.add(side === "right" ? "bg-blue-500 text-white ml-auto" : "bg-gray-300 text-gray-800");
  div.textContent = msg;
  messagecontainer.appendChild(div);
  messagecontainer.scrollTop = messagecontainer.scrollHeight;
}

// Video Call
videoCallBtn.addEventListener("click", () => socket.emit("startVideoCall", { room }));
socket.on("incomingCall", async () => {
  videoblock.classList.remove("hidden");
  await startCall();
});
socket.on("callAccepted", async () => {
  videoblock.classList.remove("hidden");
  await startCall();
});

// WebRTC
async function startCall() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  peerConnection = new RTCPeerConnection(rtcConfig);
  peerConnection.ontrack = (e) => (remoteVideo.srcObject = e.streams[0]);
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signalingMessage", { room, message: JSON.stringify({ type: "candidate", candidate: event.candidate }) });
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("signalingMessage", { room, message: JSON.stringify({ type: "offer", offer }) });

  socket.on("signalingMessage", async (msg) => {
    const data = JSON.parse(msg);
    if (data.type === "offer") {
      await peerConnection.setRemoteDescription(data.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("signalingMessage", { room, message: JSON.stringify({ type: "answer", answer }) });
    }
    if (data.type === "answer") await peerConnection.setRemoteDescription(data.answer);
    if (data.type === "candidate") await peerConnection.addIceCandidate(data.candidate);
  });
}

// Screen Sharing
document.querySelector("#screen-share-btn")?.addEventListener("click", async () => {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  const track = screenStream.getVideoTracks()[0];
  peerConnection.getSenders().forEach((sender) => {
    if (sender.track.kind === "video") sender.replaceTrack(track);
  });
  track.onended = () => {
    const localTrack = localStream.getVideoTracks()[0];
    peerConnection.getSenders().forEach((sender) => {
      if (sender.track.kind === "video") sender.replaceTrack(localTrack);
    });
  };
});
