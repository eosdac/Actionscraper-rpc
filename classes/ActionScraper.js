// const { Api, JsonRpc, RpcError, JsSignatureProvider } = require('eosjs');
// const fetch = require('node-fetch');                            // node only; not needed in browsers
// const { TextDecoder, TextEncoder } = require('text-encoding');  // node, IE11 and IE Edge Browsers

const eosjs = require('eosjs-api');
const colors = require('colors/safe');

class ActionScraper{

    constructor(eosconfig, actionhandler, state, options ){
        //todo better validate parameters. check for required function implementations update() and getState() in state obj
        if(!actionhandler.handlers.account_name){
            console.log('You need to specify an acount_name in your action handler');
            return false;
        }

        this._initEos(eosconfig);
        this.contract = actionhandler.handlers.account_name;
        this.actionhandler = actionhandler;
        this.state = state;

        this.opt = {
            batch_size : 500, //number of actions to get in each loop max:1000
            stop_when_reversible : false,
            stop_at_last_action : false,
        };

        //merge option object
        if(typeof options === 'object' && !Array.isArray(options) ){
            this.opt = Object.assign(this.opt, options);
        }
        //make options available in ActionHandler
        this.actionhandler.opt = this.opt;

        this.resume = true;
    }

    async loop(){
        if(this.stop_loop_flag === true) {return false};

        if(!this.first_loop_done){
            await this._validateActionHandler();
            await this._sleep(5000, 'Press ctrl+c to abort\n');
            if(this.resume){
                if(typeof this.state.resume === 'function'){
                    await this.state.resume(this.contract);
                }
                else{
                    console.log(colors.yellow('There is no resume function implemented in the statemanger. Starting from pos', this.state.getState(this.contract) ) );
                }
            }
            this.first_loop_done = true;
        }
        
        //get actions
        let actions = await this.getActions();
        let last_irr_block_num = (await this.eos.getInfo({})).last_irreversible_block_num;

        //some feedback
        console.log(colors.magenta('state.pos', this.state.getState(this.contract) ) );
        console.log('actions.length', actions.length);

        //handle actions
        let temp_state = 0;
        await this._asyncForEach(actions, async (action) =>{

            let is_irreversible = action.block_num <= last_irr_block_num;

            if(is_irreversible){
                temp_state++;
            }
 
            if(!is_irreversible && this.opt.stop_when_reversible){
                this.stop_loop_flag = true;
            }
            // console.log(action)

            // TODO add custom keys to action data to make it easier to process
            action.irreversible = is_irreversible;

            //call the action handler function
            let t = await this.actionhandler.exec(action.act.name, action, this.state, this.eos);
        });

        //update state only when irreversible actions have been seen
        if(temp_state != 0){
            await this.state.update(this.contract, temp_state);
        }
        
        //restart loop
        await this._sleep(500);
        this.loop();
    }

    async getActions(){
        
        return this.eos.getActions({account_name: this.contract, pos: this.state.getState(this.contract), offset: this.opt.batch_size-1}).then( a =>{
            if(!a.actions.length){
              console.log(colors.yellow('no new actions found after seq '));

              if(this.opt.stop_at_last_action){
                  this.stop_loop_flag = true;
              }

              return [];
            }

            return a.actions;
        })
        .catch(err => console.log(err) );
    }


    async _validateActionHandler(){

        try{
            let abi = await this.eos.getAbi(this.contract);
            if(!abi.abi && abi.account_name){
                console.log(colors.yellow(`The account ${this.contract} has no ABI set.`));
                return false;
            }
            let actionhandlers = Object.keys(this.actionhandler.handlers).filter(a => a != 'account_name');

            console.log(colors.magenta.bold.underline(`ActionScraper "${this.contract}"\n`) );
            console.log(colors.yellow.bold(`Watching for:`) );
            console.log(actionhandlers.join(', ')+'\n' );
            console.log(colors.yellow.bold(`All actions:`) );
            console.log(abi.abi.actions.map(a => a.name).join(', ') +'\n');
        }
        catch(err){
            console.log(colors.red(`Error getting ABI from ${this.contract}`));
            return false;
        }
    }

    _initEos(eosconfig){
        
        this.eos = eosjs(eosconfig);
        // this.eos = new JsonRpc(eosconfig.httpEndpoint, { fetch });
        console.log(colors.green('Connected to EOS') );
    }

	_sleep(t, msg='') {

        console.log('sleep for', t/1000, 'seconds.', msg);
        return new Promise(resolve => setTimeout(resolve, t));
    }

    async _asyncForEach(array, callback) {

        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array);
        }
    }

}

module.exports = {
    ActionScraper
};