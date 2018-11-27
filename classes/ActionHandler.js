const colors = require('colors/safe');

class ActionHandler{

    constructor(){
        this.handlers = {};
    }

    register(actionHandler){
        Object.assign(this.handlers, actionHandler);

    }

    async exec(handler, actiondata, state, eosapi){
        if(handler in this.handlers){

            console.log(colors.green(`Found registered action: "${handler}"`) );
            return this.handlers[handler](actiondata, state, eosapi); //return the result of the handler to the scraper in case you want to use it
            
        }
        else{
            console.log(`The action "${handler}" is not registered in the action handler.`);
            return false; // not processed feedback to scraper
        }
        
    }


}

module.exports = {
    ActionHandler
};