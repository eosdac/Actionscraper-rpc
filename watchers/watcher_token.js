const {ActionScraper} = require('../classes/ActionScraper');
const {ActionHandler} = require('../classes/ActionHandler');
const {Mongo_StateManager} = require('../classes/Mongo_StateManager');
const {config} = require('./config');
const {tokenHandler} = require('./handlers');

const scraperConfig = {
    batch_size : 1000
};


let actionHandler = new ActionHandler(tokenHandler);
let state = new Mongo_StateManager(config.db.mongoUrl, config.db.dbName);
state.connect();

let deamon = new ActionScraper( config.chain, actionHandler, state, scraperConfig);
deamon.loop();
