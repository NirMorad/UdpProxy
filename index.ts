import dgram, { RemoteInfo } from "dgram";
import http from "http";
import sio from "socket.io";
import { AddressInfo } from "net";

export class Proxy {
  cache: {[id:string]:[sio.Socket] };

  constructor() {
    this.cache  = {};
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

  bind(client: sio.Socket) {
    console.log(client);
   
    //bind client and udp socket messages events
    client.on("internal", (message: { port: any; ip: any; }) => {
      this.HandleBind(message, client);
    });
  }

  HandleBind(message: { port: any; ip: any; }, client: sio.Socket) {
    const port = message.port;
    const ip = message.ip;
    const key = ip + "-" + port;
    
    let clients : [sio.Socket] ;
    if (this.cache[key]) {
        clients = this.cache[key];
        clients.push(client);
    }else {
        //create the udp socket
        clients= [client];
        this.cache[key] = clients;
      this.createNewUdpBind(ip, clients, port);
    }
  
  }
    createNewUdpBind(ip: string, clients: any[], port: any) {
        var udp = dgram.createSocket({ type: "udp4", reuseAddr: true });
        udp.on('listening', function () {
            let address = udp.address() as AddressInfo;
            console.log('UDP Client listening on ' + address.address + ":" + address.port);
            udp.setBroadcast(true);
            udp.setMulticastTTL(64);
            udp.addMembership(ip);
        });
        udp.on("message", (msg: Buffer, rinfo: RemoteInfo) => {
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
