const {ActionScraper} = require('./classes/ActionScraper');
const {ActionHandler} = require('./classes/ActionHandler');


const eosconfig = {
    chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473", //jungle2
    httpEndpoint: "http://junglehistory.cryptolions.io", //node with mongodb plugin
};

const scraperconfig = {
    batch_size : 5, //number of actions to get in each loop max:1000
    stop_when_reversible : false,
    stop_at_last_action : false,
};

let my_actionHandler = new ActionHandler();

my_actionHandler.register({

    account_name : 'dacelections',

    propose : async (actiondata, state, eosapi) => {

        // let decoded = await eosapi.abiBinToJson('eosio.msig', 'propose', actiondata.act.data.trx.actions[0].data)
        //above call doesn't work on 1.5 version :-)

        //console.log the first action inside the msig trx
        console.log(
            actiondata.act.data.proposer, 
            actiondata.act.data.proposal_name,
            actiondata.act.data.trx.actions[0].account,
            actiondata.act.data.trx.actions[0].name,
            actiondata.act.data.trx.actions[0].data //so lets print the packed data
        )
    }
})


//bare minimum state implementation. In reality you would use something more advanced (see ./classes/Mongo_StateManager.js)
let memstate = {
    pos: 0,
    update: function( contract, x){ this.pos +=x; },
    getState: function(){ return this.pos; }
}

let deamon = new ActionScraper(eosconfig, my_actionHandler, memstate, scraperconfig);
//start the action scaper
deamon.loop();
