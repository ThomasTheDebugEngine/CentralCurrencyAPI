import mongoose, { Schema } from "mongoose";
import { AxiosResponse } from "axios";
//import {IRquest, Rquest} from "../contollers/currency-controller";


export interface IDBManager{
    Connect(): void;
    //addNewCurrencyEntry(resp: any): void; //need to find the correct type
    getExchangeRates(): void;
}

export class DBmanager implements IDBManager{
    private DBaddr:string = "127.0.0.1:4041/test1"; //TODO change to CurrencyDB after testing
    
    private currencySchema = new Schema({
        
        apiSource: String,
        baseCurrency: String,
        entryDate: String,

        rates:{type: Map}
    });

    private connection: mongoose.Connection;
    private currrencyModel:any;
    private newModel: any;

    async Connect(){
        let connOpts = {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }

        this.connection = mongoose.connection;   
        
        try {
            mongoose.connect("mongodb://" + this.DBaddr, connOpts);
        } 
        catch (error) {
            console.error("DB CONN ERROR: " + error);
        }

        this.connection.once("open", () => {
            console.info("DB connected @ " + this.DBaddr);
        });
        
        this.connection.on("error", (err:Error) => {
            console.error("DB ERROR: " + err);
        });
    }

    async addNewCurrencyEntry(resp: any){
        //? may need to check if all APIs have these fields the same
        const baseCurrency: string = resp.data.base;
        const entryDate: string = resp.data.date;
        const sourceURL: string = resp.config.url;
        const rateData = resp.data.rates

        var rateMap: Map<string, string> = new Map();

        Object.keys(rateData).forEach((key)=>{
            rateMap.set(key, rateData[key]);
        });

        this.currrencyModel = mongoose.model("currencyModel", this.currencySchema);

        const currencyEntry = new this.currrencyModel({
            apiSource: sourceURL,
            baseCurrency: baseCurrency,
            entryDate: entryDate,

            rates: {rateMap}
        });
        
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
    isDataStale():boolean{
        let cursor: mongoose.QueryCursor<any> = this.findYesterdayDbEntry("currencymodels",this.currencySchema);

        if(cursor == null || cursor == undefined){
            return true; //no new rates exist in the db need new rates
        }
        else{
            return false; //data in the db is up to date
        }
    }

    async getExchangeRates(){ //? maybe return in here also
        if(this.isDataStale()){
            console.log("STALE DATA")
            //TODO data is old request new data (need a way to signal that response is needed)
            //this.addNewCurrencyEntry(response);
        }
        else{
            //TODO data is up to date: query(done), extract(WIP) and return(TODO)
            let cursor: mongoose.QueryCursor<any> = this.findYesterdayDbEntry("currencymodels",this.currencySchema);

            await cursor.eachAsync((doc: mongoose.Document) => {
                console.log(doc); //TODO extraction happens here fo each document
            });
        }
    }

    findYesterdayDbEntry(modelName: string, inputSchema: mongoose.Schema):mongoose.QueryCursor<any>{
        let searchModel = mongoose.model(modelName, inputSchema);
        let yesterdayZulu = this.getYesterdayZulu();

        let cursor:mongoose.QueryCursor<any> = searchModel.find(
            {
                "entryDate": yesterdayZulu
            }
        ).lean().cursor();

        return cursor;
    }

    getYesterdayZulu(): string{
        let todayDate = new Date();
        todayDate.setDate(todayDate.getDate() - 1);
        todayDate.setMinutes(todayDate.getMinutes() - todayDate.getTimezoneOffset());

        let yesterdayZulu = todayDate.toISOString().slice(0,10);
        
        return yesterdayZulu;
    }
}
