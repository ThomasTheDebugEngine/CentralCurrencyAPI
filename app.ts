import express, {Router, Request, Response} from "express";
import {CurrencyRouter} from  "./api/routes/currency-route";

class Server{
    private Lport: number = null;
    private app: any = express();

    constructor(ListenPort: number){
        this.Lport = ListenPort;
    }

    Start(): void{
        this.app.listen(this.Lport, () => {
            console.log("server litsening @ " + this.Lport);
            this.LoadRoutes();
        });
    }

    LoadRoutes(){
        this.app.use(CurrencyRouter);
    }
}

const server: Server = new Server(4040);

server.Start();