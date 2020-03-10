import {Request, Response} from "express";
import { DBmanager , IDBManager} from "../models/currency-model";
import axios, { AxiosResponse, AxiosPromise } from "axios";

 

export function CurrencyController(req: Request, res: Response){
    let CurrReq = new UrlInterpreter(req.params.CurrencyParams);
    res.send("URL params via controller: " + req.params.CurrencyParams);
}

class UrlInterpreter{
    private currency1: string = null;
    private currency2: string = null;

    constructor(requestParams: string){
        [this.currency1, this.currency2] = requestParams.split("-");
        console.log("URL via interpreter " + this.currency1 + " | " + this.currency2);
    }
}


export class Rquest{
    private Url: string = "https://api.exchangeratesapi.io/latest";
    private db: IDBManager;

    constructor(_DBmanager: IDBManager){
        this.db = _DBmanager;
    }

    async GetExchangeRates(apiURL: string){
        try {
            const response = await axios.get(apiURL);
            return response;
        } 
        catch (error) {
            console.error("Request error: " + error);
            throw error;
        }
    }

    async getNewRates(){
        var respon = await this.GetExchangeRates(this.Url);
        
        this.db.Connect();
        this.db.AddNewCurrencyEntry(respon);
    }


    /*
    CompileQuery(){
        let UsedAPI: string = "https://api.exchangeratesapi.io/latest"; //TODO default automate later
        this.GetExchangeRates(UsedAPI)
        .then((resp) => {
            console.log("TEST IS: " + UsedAPI)

            var 

        }).catch((err)=>{ throw "ERROR: " + err + " request from : " + UsedAPI});

        //console.log("TEST IS: " + ratesBody)
    }
    */
}

var exc = new Rquest(new DBmanager);
exc.getNewRates();
//exc.CompileQuery();
