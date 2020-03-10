import mongoose, { Schema } from "mongoose";
import { AxiosResponse } from "axios";
//import {IRquest, Rquest} from "../contollers/currency-controller";


export interface IDBManager{
    Connect():void;
    addNewCurrencyEntry(resp: any):void; //need to find the correct type
}

export class DBmanager implements IDBManager{
    private DBaddr:string = "127.0.0.1:4041/test1"; //TODO change to CurrencyDB after testing
    
    private currencySchema = new Schema({
        
        apiSource: String,
        baseCurrency: String,
        entryDate: String,

        rates:{type: Map}
    });

    Connect(){
        let connOpts = {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }

        let conStatus = mongoose.connection;   
        
        try {
            mongoose.connect("mongodb://" + this.DBaddr, connOpts);
        } 
        catch (error) {
            console.error("DB CONN ERROR: " + error);
        }

        conStatus.once("open", () => {
            console.info("DB connected @ " + this.DBaddr);
        });
        
        conStatus.on("error", (err:Error) => {
            console.error("DB ERROR: " + err);
        });
    }

    async addNewCurrencyEntry(resp: any){
        //? may need to check if all APIs have these fields the same
        var baseCurrency: string = resp.data.base;
        var entryDate: string = resp.data.date;
        var sourceURL: string = resp.config.url;
        var rateData = resp.data.rates

        var rateMap: Map<string, string> = new Map();

        Object.keys(rateData).forEach((key)=>{
            rateMap.set(key, rateData[key]);
        });

        var currencyModel = mongoose.model("currencyModel", this.currencySchema);

        const currencyEntry = new currencyModel({
            apiSource: sourceURL,
            baseCurrency: baseCurrency,
            entryDate: entryDate,

            rates: {rateMap}
        });
        
        /*
        currencyEntry.updateOne(
            {},
            {
                $push: {rates: {countryCode: "TRYTRYTRYTRYTRY"}}
            }
        ).then((rates)=>{console.log(rates)})
        */
        
        await currencyEntry.save((err: Error) => {
            if(err) {
                console.error("ERROR: save failed: " + err);
                throw err;
            }
            else{
                console.log("SUCCESS: save complete")
            }
        });
        
    }
    //TODO check base and rebase if not USD (base does not appear in request need to derive it)
    //TODO make a function to check if data is stale
}
