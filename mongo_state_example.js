const {ActionScraper} = require('./classes/ActionScraper');
const {ActionHandler} = require('./classes/ActionHandler');
const {Mongo_StateManager} = require('./classes/Mongo_StateManager');

//create a new action handler instance
let my_actionHandler = new ActionHandler();

/*
register actions to watch for and specify a handler function to process the action data. 
the handler function can be async code.
Do something useful with the actiondata. for example add it to db or push to socket server.
You might want to restructure the data and test if it originate from the correct receiver. 
The statemanager (state) is passed back to this hadler via ActionScraper->ActionHandler->handler.
This is useful to share the same db connection for instance.
*/
my_actionHandler.register({

    account_name : 'dacelections',

    votecust : async (actiondata, state, eosapi) => {

        await state.db.collection('votes').updateOne({ _id: actiondata._id }, {$set:actiondata}, { upsert: true } );
    },

    stprosfileuns : async (actiondata, state) => {
        console.log('stprofileuns', actiondata)
        // await waitFor(2000);
        // return 'ddd'
    }
})

/*
Create a new instance of the actionscraper. Pass the account to watch,
an actionhandler and optionally a statemanager in to the constructor.
The statemanager is also accessible in the action handlers (see state parameter).
*/
const eosconfig = {
    chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473", //jungle2
    httpEndpoint: "http://junglehistory.cryptolions.io", //node with mongodb plugin
}

let s = new Mongo_StateManager();
s.connect(); //todo move this initialization to the scraper

let deamon = new ActionScraper( eosconfig, my_actionHandler, s);
//start the action scaper
deamon.loop();
