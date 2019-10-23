import dgram from "dgram";
import http from "http";
import sio from "socket.io";

export class Proxy {
  cache: {};

  constructor() {
    this.cache = {};
    let server = http.createServer();
    let so = sio(server);

    const io = so.of("/proxy");
    io.on("connect", socket => {
      this.bind(socket);
      socket.on("disconnect",(reason) => {
        console.log(socket);
      });
    });

    server.listen(8080);
  }

  bind(client : any) {
    console.log(client);
   
    //bind client and udp socket messages events
    client.on("internal", (message: { port: any; ip: any; }) => {
      this.HandleBind(message, client);
    });
  }

  HandleBind(message: { port: any; ip: any; }, client: any) {
    const port = message.port;
    const ip = message.ip;
    const key = ip + "-" + port;
    
    let clients = [];
    if (this.cache[key]) {
        clients = this.cache[key];
        clients.push(client);
    }else {
        //create the udp socket
        clients.push(client);
        this.cache[key] = clients;
      this.createNewUdpBind(ip, clients, port);
    }
  
  }
    createNewUdpBind(ip: string, clients: any[], port: any) {
        var udp = dgram.createSocket("udp4", { reuseAddr: true });
        udp.on('listening', function () {
            var address = udp.address();
            console.log('UDP Client listening on ' + address.address + ":" + address.port);
            udp.setBroadcast(true);
            udp.setMulticastTTL(64);
            udp.addMembership(ip);
        });
        udp.on("message", function (msg: string, rinfo: { address: any; port: any; }) {
            clients.forEach(clientHandler => {
                clientHandler.emit("dgram-message", {
                    msg: msg.toString("ascii"),
                    rinfo: {
                        address: rinfo.address,
                        port: rinfo.port
                    }
                });
            });
        });
        //bind
        udp.bind({ port: port });
    }
}

let x = new Proxy();
