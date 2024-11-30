/*const express = require('express');
const app = express();
const indexRouter = require('./routes/index');
const path = require('path');
app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));

const http = require('http');
let server = http.createServer(app);
let socketIo = require('socket.io');
let io = socketIo(server);

let waitinguser = [];
let rooms ={};
io.on("connection",(socket)=>{
   socket.on("joinroom",()=>{
     if(waitinguser.length > 0){
    let partner =  waitinguser.shift();
   let roommate = `${socket.i}-${partner.id}`;
      socket.join(roommate);
      partner.join(roommate);
      io.to(roommate).emit("joined",roommate);
       }else{
          waitinguser.push(socket);
       }
   });
   socket.on("message",(data)=>{
      socket.broadcast.to(data.room).emit("message",data.message);
   });
   socket.on("signalingMessage",(data)=>{
       socket.broadcast.to(data.room).emit("message",data.message);
   });
   socket.on("startVideoCall",({room})=>{
       socket.broadcast.to(room).emit("incomingCall");
   });
   socket.on("rejectCall",({room})=>{
      socket.broadcast.to(room).emit("callRejected");
   });
   socket.on("acceptCall",({room})=>{
        socket.broadcast.to(room).emit("callAccepted");
   });
   
   socket.on("disconnect",()=>{
        let find = waitinguser.findIndex((waitinguser)=> waitinguser.id === socket.id);
        waitinguser.splice(find,1);
   });
});

app.use('/',indexRouter);

server.listen(3001);
*/

const express = require("express");
const app = express();
const indexRouter = require("./routes/index");
const path = require("path");
require('dotenv').config();
const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server);

let waitingusers = [];
let rooms = {};

io.on("connection", function (socket) {
  socket.on("joinroom", function () {
    if (waitingusers.length > 0) {
      let partner = waitingusers.shift();
      const roomname = `${socket.id}-${partner.id}`;

      socket.join(roomname);
      partner.join(roomname);

      io.to(roomname).emit("joined", roomname);
    } else {
      waitingusers.push(socket);
    }
  });

  socket.on("signalingMessage", function (data) {
    socket.broadcast.to(data.room).emit("signalingMessage", data.message);
  });

  socket.on("message", function (data) {
    socket.broadcast.to(data.room).emit("message", data.message);
  });

  socket.on("startVideoCall", function ({ room }) {
    socket.broadcast.to(room).emit("incomingCall");
  });

  socket.on("rejectCall", function ({ room }) {
    socket.broadcast.to(room).emit("callRejected");
  });

  socket.on("acceptCall", function ({ room }) {
    socket.broadcast.to(room).emit("callAccepted");
  });

  socket.on("disconnect", function () {
    let index = waitingusers.findIndex(
      (waitingUser) => waitingUser.id === socket.id
    );

    waitingusers.splice(index, 1);
  });
});

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

server.listen(process.env.PORT || 3001);