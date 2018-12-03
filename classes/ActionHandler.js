const colors = require('colors/safe');

class ActionHandler{

    constructor(actionhandler={}){
        this.handlers = actionhandler;
    }

    register(actionHandler){
        Object.assign(this.handlers, actionHandler);

    }

    async exec(handler, actiondata, state, eosapi){
        // console.log(this.opt) actionscraper options
        if('*' in this.handlers){

            console.log(colors.green(`Found registered action: "${handler}${colors.yellow.bold('*')}"`) );
            try{
                return this.handlers['*'](actiondata, state, eosapi);
            }catch(e){console.log('error', e)}
        }
        else if(handler in this.handlers){

            console.log(colors.green(`Found registered action: "${handler}"`) );
            try{
                return this.handlers[handler](actiondata, state, eosapi);
            }catch(e){console.log('error', e)}
            
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