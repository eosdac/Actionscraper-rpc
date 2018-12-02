const {ActionScraper} = require('../classes/ActionScraper');
const {ActionHandler} = require('../classes/ActionHandler');
const {Mongo_StateManager} = require('../classes/Mongo_StateManager');
const {config} = require('./config');
const {custodiancontract} = require('./handlers');

const scraperconfig = {
    batch_size : 1000, 
    
};


let my_actionHandler = new ActionHandler();

my_actionHandler.register(custodiancontract)

let s = new Mongo_StateManager(config.db.mongoUrl, config.db.dbName);
s.connect();

let deamon = new ActionScraper( config.chain, my_actionHandler, s, scraperconfig);
deamon.loop();
