import mongoose, { Schema } from "mongoose";
import { AxiosResponse } from "axios";
//import {IRquest, Rquest} from "../contollers/currency-controller";


export interface IDBManager{
    Connect(): void;
    isDataStale(): Promise<boolean>;
    getExchangeRates(response?: any): void;
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
            throw Error("DB CONN ERROR: " + error);
        }

        this.connection.once("open", () => {
            console.info("DB connected @ " + this.DBaddr);
        });
        
        this.connection.on("error", (err:Error) => {
            throw Error("DB ERROR: " + err);
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
                throw Error("ERROR: save failed: " + err);
            }
            else{
                console.log("SUCCESS: save complete")
            }
        });
        
    }
    async isDataStale():Promise<boolean>{
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

    async getExchangeRates(response?: any){ //? maybe return in here also
        try {
            var boolDataStale: boolean = await this.isDataStale();
            
        } 
        catch (error) {
            throw Error("ERROR: external checking stale data " + error);
        }

        if(boolDataStale){ //! these are commented out for cache and fallback data testing
            console.log("STALE DATA");
            //TODO data is old request new data
            this.addNewCurrencyEntry(response);
        }
        else if (!boolDataStale){
            console.log("DATA EXISTS");
            
            //TODO data is up to date: query(done), extract(WIP) and return(TODO)
            /*let cursor: mongoose.QueryCursor<any> = this.findYesterdayDbEntry("currencymodels",this.currencySchema);

            await cursor.eachAsync((doc: mongoose.Document) => {
                console.log(doc); //TODO extraction happens here for each document
            });*/
        }
    }

    //? maybe make this async later
    findRecentDbEntry(modelName: string, inputSchema: mongoose.Schema): mongoose.QueryCursor<any>{
        let searchModel = mongoose.model(modelName, inputSchema);
        let marketDateArr: string[] = this.getMarketDates();

        for (let idx = 0; idx < marketDateArr.length; idx++) { //latest date first
            const marketDate:string = marketDateArr[idx];

            const cursor: mongoose.QueryCursor<any> = searchModel.find(
                {
                    "entryDate": marketDate
                }
            ).lean().cursor();

            if(idx == 0 && (cursor != null || cursor != undefined)){
                //TODO trigger function to delete old entries (2nd index is old date)
                //! might not need this as the count func will do checking and deleting before this gets called
            }
    
            return cursor;
        }
    }

    async getRecentDbEntryCount(modelName: string, inputSchema: mongoose.Schema):Promise<number>{
        const searchModel = mongoose.model(modelName, inputSchema);
        const marketDateArr: string[] = this.getMarketDates();

        for (let idx = 0; idx < marketDateArr.length; idx++) { //latest date first
            let marketDate: string = marketDateArr[idx];

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

    async deleteOldDbEntry(inputModelName: string, inputSchema: mongoose.Schema, inputQuery?: string): Promise<void>{
        const searchModel = mongoose.model(inputModelName, inputSchema);

        if(inputQuery.length != 0 || !inputQuery == null || !inputQuery == undefined){
            try{
                var docsDeleted = await searchModel.deleteMany(
                    {
                        "entryDate": inputQuery
                    }
                );
    
                if(docsDeleted.ok == 1 && docsDeleted.deletedCount > 0){
                    console.log("deleted " + docsDeleted.deletedCount + " out of " + docsDeleted.n + " old documents");
                }
            }
            catch (error) {
                if(error){ throw Error("ERROR: deleting databse entries " + error)}
            }
        }
    }

    getMarketDates(): string[]{ //? the 2 date system needs revamping to a smarter system later
        var marketDate: Date = new Date();
        var marketDatesArr: string[] = [];
        
        //sunday
        if(marketDate.getDay() == 0){
            marketDate.setDate(marketDate.getDate() - 2);
            marketDate.setMinutes(marketDate.getMinutes() - marketDate.getTimezoneOffset());

            marketDatesArr[0] = marketDate.toISOString().slice(0,10);
            marketDatesArr[1] = "NONE";
            return marketDatesArr;
        }
        //saturday
        else if(marketDate.getDay() == 6){
            marketDate.setDate(marketDate.getDate() - 1);
            marketDate.setMinutes(marketDate.getMinutes() - marketDate.getTimezoneOffset());

            marketDatesArr[0] = marketDate.toISOString().slice(0,10);
            marketDatesArr[1] = "NONE";
            return marketDatesArr;
        }
        else{
            console.log("WEEKDAY TRIGGERED")
            
            for (let idx = 0; idx < 2; idx++) {
                marketDate.setDate(marketDate.getDate() - idx);
                marketDate.setMinutes(marketDate.getMinutes() - marketDate.getTimezoneOffset());
                
                marketDatesArr[idx] = marketDate.toISOString().slice(0,10);
            }
            return marketDatesArr;
        }

    }
}
