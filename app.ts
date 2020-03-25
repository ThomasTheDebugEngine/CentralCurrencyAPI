import express from "express";
import {CurrencyRouter} from  "./api/routes/currency-route";

//! there is a bug with stale data checking where data is stale after midnight monday to market openings (8.30AM ish)

class Server{
    private Lport: number = null;
    private app: any = express();

    constructor(ListenPort: number){
        this.Lport = ListenPort;
    }

    Start(): void{
        this.app.listen(this.Lport, () => {
            console.log("server listening @ " + this.Lport);
            this.LoadRoutes();
        });
    }

    LoadRoutes(){
        this.app.use(CurrencyRouter);
    }
}

const server: Server = new Server(4040);
server.Start();