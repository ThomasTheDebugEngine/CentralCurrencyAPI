import mongoose, { Schema } from "mongoose";
import { AxiosResponse } from "axios";
//import {IRquest, Rquest} from "../contollers/currency-controller";


export interface IDBManager{
    Connect(): void;
    isDataStale(): Promise<boolean>;
    getExchangeRates(response?: any): void;
}

export class DBmanager implements IDBManager{
    private DBaddr: string = "127.0.0.1:4041/test1"; //TODO change to CurrencyDB after testing
    
    private currencySchema = new Schema({
        
        apiSource: String,
        baseCurrency: String,
        entryDate: Number,

        rates:{type: Map}
    });

    private connection: mongoose.Connection;
    private currrencyModel: any;

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
            throw Error("DB CONN ERROR: " + error);
        }

        this.connection.once("open", () => {
            console.info("DB connected @ " + this.DBaddr);
        });
        
        this.connection.on("error", (err: Error) => {
            throw Error("DB ERROR: " + err);
        });
    }

    async addNewCurrencyEntry(resp: any){
        //? may need to check if all APIs have these fields the same
        const baseCurrency: string = resp.data.base;
        const entryDate: number = this.DateToTimestamp(resp.data.date);
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
                throw Error("ERROR: save failed: " + err);
            }
            else{
                console.log("SUCCESS: save complete")
            }
        });
        
    }

    async isDataStale(): Promise<boolean>{
        try {
            var documentCount: number = await this.getRecentDbEntryCount("currencymodels",this.currencySchema);
        } 
        catch (error) {
            throw Error("ERROR: internal checking stale data" + error);
        }

        if(documentCount == 0){
            return true; //no new rates exist in the db need new rates
        }
        else{
            //console.log(cursor)
            return false; //data in the db is up to date
        }
    }

    async getExchangeRates(response?: any){ //TODO make it compatible with URL interpreter
        try {
            var boolDataStale: boolean = await this.isDataStale();
            
        } 
        catch (error) {
            throw Error("ERROR: external checking stale data " + error);
        }

        if(boolDataStale){
            console.log("STALE DATA");
            this.addNewCurrencyEntry(response);
        }
        else if (!boolDataStale){
            console.log("DATA EXISTS");
            
            //TODO data is up to date: query(done), extract(done) and return(WIP)
            let cursor: mongoose.QueryCursor<any> = await this.findRecentDbEntry("currencymodels",this.currencySchema);

            let ObjArr = [];

            await cursor.eachAsync((doc: mongoose.Document) => {
                ObjArr.push(doc)
            });

            var responseObj = { //TODO make currency 1 and 2 values passed in via params
                apiSource: "",
                baseCurrency: "",
                entryDate: "",
                currency1: "",
                currency2: ""
            }

            for (let idx = 0; idx < ObjArr.length; idx++) {
                console.log("Source is: " + ObjArr[idx].apiSource);
                responseObj.apiSource = ObjArr[idx].apiSource

                console.log("Base is: " + ObjArr[idx].baseCurrency);
                responseObj.baseCurrency = ObjArr[idx].baseCurrency

                console.log("Entry date is: " + ObjArr[idx].entryDate);
                responseObj.entryDate = ObjArr[idx].entryDate

                console.log("map is: " + ObjArr[idx].rates.rateMap["TRY"]); //TODO change with variable
                console.log("map is: " + ObjArr[idx].rates.rateMap["USD"]); //TODO change with variable   
            }
        }
    }

    async findRecentDbEntry(modelName: string, inputSchema: mongoose.Schema): Promise<mongoose.QueryCursor<any>>{
        let searchModel = mongoose.model(modelName, inputSchema);
        let marketDateArr: number[] = this.getMarketDates();

        const marketDate: number = marketDateArr[0];

        const cursor: mongoose.QueryCursor<any> = searchModel.find(
            {
                "entryDate": marketDate
            }
        ).lean().cursor();
    
        return cursor;
        
    }

    async getRecentDbEntryCount(modelName: string, inputSchema: mongoose.Schema): Promise<number>{
        const searchModel = mongoose.model(modelName, inputSchema);
        const marketDateArr: number[] = this.getMarketDates();

        for (let idx = 0; idx < marketDateArr.length; idx++) { //latest date first
            let marketDate: number = marketDateArr[idx];

            try {
                const documentCount: number = await searchModel.countDocuments(
                    {
                        "entryDate": marketDate
                    },
                ).lean();

                if(idx == 0 && documentCount != 0){
                    //last index is old date
                    await this.deleteOldDbEntry(modelName, inputSchema, marketDateArr[marketDateArr.length - 1]);
                }
                return documentCount;
            } 
            catch (error) {
                throw Error("ERROR: document count error " + error);
            }
        }
    }

    async deleteOldDbEntry(inputModelName: string, inputSchema: mongoose.Schema, inputQuery?: number): Promise<void>{
        const searchModel = mongoose.model(inputModelName, inputSchema);

        if(inputQuery > 0){
            try{
                var docsDeleted = await searchModel.deleteMany(
                    {
                        "entryDate": {$lt : inputQuery}
                    }
                );
    
                if(docsDeleted.ok == 1 && docsDeleted.deletedCount > 0){
                    console.log("deleted " + docsDeleted.deletedCount + " out of " + docsDeleted.n + " old documents");
                }
            }
            catch (error) {
                if(error){ 
                    throw Error("ERROR: deleting databse entries " + error)
                }
            }
        }
    }

    getMarketDates(): number[]{ //? the 2 date system needs revamping to a smarter system later
        var marketDate: Date = new Date();
        var marketDatesArr: number[] = [];
        
        //sunday
        if(marketDate.getDay() == 0){
            marketDate.setDate(marketDate.getDate() - 2);
            marketDate.setMinutes(marketDate.getMinutes() - marketDate.getTimezoneOffset());

            marketDatesArr[0] = this.DateToTimestamp(marketDate.toISOString().slice(0,10));
            marketDatesArr[1] = -1;
            return marketDatesArr;
        }
        //saturday
        else if(marketDate.getDay() == 6){
            marketDate.setDate(marketDate.getDate() - 1);
            marketDate.setMinutes(marketDate.getMinutes() - marketDate.getTimezoneOffset());

            marketDatesArr[0] = this.DateToTimestamp(marketDate.toISOString().slice(0,10));
            marketDatesArr[1] = -1;
            return marketDatesArr;
        }
        else{
            for (let idx = 0; idx < 2; idx++) {
                marketDate.setDate(marketDate.getDate() - idx);
                marketDate.setMinutes(marketDate.getMinutes() - marketDate.getTimezoneOffset());
                
                marketDatesArr[idx] = this.DateToTimestamp(marketDate.toISOString().slice(0,10));
            }
            return marketDatesArr;
        }

    }

    DateToTimestamp(strDate: string): number{
        var datum = Date.parse(strDate);
        return datum / 1000;
    }
}
