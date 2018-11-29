const {ActionScraper} = require('./classes/ActionScraper');
const {ActionHandler} = require('./classes/ActionHandler');
const {Mongo_StateManager} = require('./classes/Mongo_StateManager');
const {daccustodian} = require('./handlers/mainnet');

const eosconfig = {
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
    httpEndpoint: "http://history.cryptolions.io", 
};

const scraperconfig = {
    batch_size : 5, 
    stop_when_reversible : false,
    stop_at_last_action : false,
};


let my_actionHandler = new ActionHandler();

my_actionHandler.register(daccustodian)

let s = new Mongo_StateManager();
s.connect();

let deamon = new ActionScraper( eosconfig, my_actionHandler, s, scraperconfig);
deamon.loop();
