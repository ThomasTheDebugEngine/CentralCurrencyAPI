import {Request, Response} from "express";
import { DBmanager, IDBManager} from "../models/currency-model";
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


class Rquest{
    private Url: string = "https://api.exchangeratesapi.io/latest?base=USD";
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
            throw Error("Request error: " + error);
        }
    }

    async getNewRates(){
        this.db.Connect();

        if(this.db.isDataStale){
            try {
                var response = await this.GetExchangeRates(this.Url);
                this.db.getExchangeRates(response);   
            } 
            catch (error) {
                throw Error("ERROR: axios response " + error);
            }
        }
        else{
            this.db.getExchangeRates()
        }
    }
}

var exc = new Rquest(new DBmanager);
exc.getNewRates();
