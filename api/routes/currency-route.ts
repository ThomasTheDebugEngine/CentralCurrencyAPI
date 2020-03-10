import express, {Router} from "express";
import {CurrencyController} from "../contollers/currency-controller"

var CurrencyRouter:Router = express.Router();
CurrencyRouter.get("/currency/:CurrencyParams", CurrencyController);

export {CurrencyRouter};

// 127.0.0.1:4040/currency/USD-TRY