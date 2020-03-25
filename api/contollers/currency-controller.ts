import {Request, Response} from "express";
import { DBmanager, IDBManager} from "../models/currency-model";
import axios, { AxiosResponse, AxiosPromise } from "axios";

export async function CurrencyController(req: Request, res: Response){
    let paramArray: string[] = req.params.CurrencyParams.split("-");
    //TODO add type checking here to make sure the params are ok and convertable to 3 letter ISO codes
    
    try {
        let rates = await exc.getNewRates(paramArray);
        
        console.log("RSP TST IS: ", rates); //TODO modify headers in response | throw status error if error is there
        res.send(rates)
    } 
    catch (error) {
        throw Error("ERROR: unable to serve clients " + error)
    }
}

class Rquest{
    private Url: string = "https://api.exchangeratesapi.io/latest?base=USD";
    private db: IDBManager;

    constructor(_DBmanager: IDBManager){
        this.db = _DBmanager;
    }

    async RequestExchangeRates(apiURL: string){//TODO add request error handling
        try {
            const response = await axios.get(apiURL);
            return response;
        } 
        catch (error) {
            throw Error("Request error: " + error);
        }
    }

    async getNewRates(currencyParams: string[]){
        this.db.Connect();

        const dataIsStale: boolean = await this.db.isDataStale();

        if(dataIsStale){
            let count = 0;

            try {
                var response = await this.RequestExchangeRates(this.Url);
                
                for (let idx = 0; idx < 2; idx++) { //signal repeater to ensure successful return or rates
                    var newRates = await this.db.getExchangeRates(currencyParams, response);
                    count += 1;
                }
                return newRates;
            } 
            catch (error) {
                throw Error("ERROR: axios response " + error);
            }
        }
        else{
            const newRates = await this.db.getExchangeRates(currencyParams, response);
            return newRates;
        }
    }
}

let exc = new Rquest(new DBmanager);