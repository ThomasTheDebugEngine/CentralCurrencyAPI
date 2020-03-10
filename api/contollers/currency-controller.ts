import {Request, Response} from "express";
//import { DBmanager} from "../models/currency-model";
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

export interface IRquest{
    GetExchangeRates(apiURL:string);
}


export class Rquest implements IRquest{
    private Url: string = "https://api.exchangeratesapi.io/latest";

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

var exc = new Rquest();
//exc.CompileQuery();
