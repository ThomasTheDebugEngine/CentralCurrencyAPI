import mongoose, { Schema } from "mongoose";
import { AxiosResponse } from "axios";
//import {IRquest, Rquest} from "../contollers/currency-controller";


export interface IDBManager{
    Connect(): void;
    //addNewCurrencyEntry(resp: any): void; //need to find the correct type
    checkStaleData(response: any): void;
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

    Connect(){
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

    async checkStaleData(response: any){
        if(this.currrencyModel != undefined){ //! reversed for debugging
            console.log("no data found requesting latest rates...");
            this.addNewCurrencyEntry(response);
        }
        else { //! needs continous run to be implemented first (checking via remote method now)
            console.log("SOME DATA IS HERE");
            //TODO check data timestamp

            let yesterdayZuluDate: string = this.getYesterdayZulu();

            let tstmodel = mongoose.model("currencymodels", this.currencySchema); //need to change model later
            
            //console.log(Date.now.toString())
            //var query = ""

            let query = await tstmodel.find(
                {
                    "entryDate": yesterdayZuluDate //data is up to date
                }

            ).lean();

            query.forEach(function(err, doc){
                //if(err) {console.error("ERROR querying data: " + err)}
                console.log(doc)
            })

            //const {
            //    apiSource
            //} = query;

            

            //console.log(query);
            
        }
    }

    getYesterdayZulu(): string{
        let todayDate = new Date();
        todayDate.setDate(todayDate.getDate() - 1);
        todayDate.setMinutes(todayDate.getMinutes() - todayDate.getTimezoneOffset());

        let yesterdayZulu = todayDate.toISOString().slice(0,10);
        
        return yesterdayZulu;
    }
}
//TODO make a function to check if data is stale (from database not request)
