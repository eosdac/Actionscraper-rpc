const {ActionScraper} = require('../classes/ActionScraper');
const {ActionHandler} = require('../classes/ActionHandler');
const {File_StateManager} = require('../classes/File_StateManager');


const eosconfig = {
    chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473", //jungle2
    httpEndpoint: "http://junglehistory.cryptolions.io", //node with mongodb plugin
}

const scraperconfig = {
    batch_size : 1000,

}

let my_actionHandler = new ActionHandler();


//using a wildcard will ignore other registered handler. TODO: make it possible to register multiple handlers for the same action
my_actionHandler.register({

    account_name : 'kasdactokens',

    'transfer' : async (actiondata, state, eosapi) => {

        if(actiondata.irreversible){
            state.write('all_actions6.txt', JSON.stringify(actiondata) );
            return true;
        }
    },

})

let deamon = new ActionScraper( eosconfig, my_actionHandler, new File_StateManager(), scraperconfig);
//start the action scaper
deamon.loop();
