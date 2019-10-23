import io from "socket.io-client";
let sio = io("http://127.0.0.1:8080/proxy");

sio.on("connect", (_: any) => {
  sio.emit("internal", {
    port: 41848,
    ip: "230.185.192.108"
  });

});


sio.on('dgram-message', (messs: any)=> {
    console.log(messs);
  });
