const MongoClient = require('mongodb').MongoClient;
const colors = require('colors/safe');
const {Base_StateManager} = require('./abstract/Base_StateManager');

//This class manages the state of the (many) ActionScraper instances.
//and can be used to insert action data in to collections from within the action handlers
class Mongo_StateManager extends Base_StateManager{

    constructor(mongoUrl='mongodb://localhost:27017/', dbName='eosdac'){
        super();
        this.pos = [];//object to hold current state {}
        this.mongoUrl = mongoUrl;
        this.dbName = dbName;

    }

    async connect(){
        this.db = await MongoClient.connect(this.mongoUrl, { useNewUrlParser: true })
        .then(client => {
            console.log(colors.green('mongo connected'));
            let db = client.db(this.dbName);
            return db;
        })
        .catch(e => {console.log(colors.red(e)); return null;} );
    }

    async update(contractname_id, pos, libn=0){
        try{
            let res = await this.db.collection('state').findOneAndUpdate(
                { _id: contractname_id },
                { $inc: { pos: pos }, $set: {last_irr_block: libn} },
                {  upsert: true, returnOriginal:false}
            )
            if(res.ok){
                this.setState(contractname_id, res.value);
                // this.pos[contractname_id] = res.value.pos;
            }
            return this.getState(contractname_id);
        }catch(e){
            console.log(colors.yellow(e));
            return false;
        }
    }

    async resume(contractname_id){
        try{
            let res = await this.db.collection('state').findOne({ _id: contractname_id });
            if(res){
                this.setState(contractname_id, res);
                console.log('Resuming from pos', res.pos);
            }
            else{
                this.setState(contractname_id, { _id : contractname_id, last_irr_block : 0, pos : 0 } );
            }
            return this.getState(contractname_id);
        }catch(e){
            console.log(colors.yellow(e));
            return false;
        }
    }

    setState(contractname_id, newstate){
        let stateIndex = this.pos.findIndex(obj => obj._id == contractname_id);
        if(stateIndex == -1){
            this.pos.push(newstate);
        }
        else{
            this.pos[stateIndex] = newstate;
        }
    }

    getState(contractname_id){
        let s = this.pos.find(obj => obj._id == contractname_id);
        if(s){
            return s.pos;
        }
        else{
            return 0;
        }
    }
}


//test
// let t = new StateManager();

// (async ()=>{
//     await t.connect();
//     console.log(await t.update('dacelections',10) )
//     console.log(await t.resume('dacelections') )
// })();

module.exports = {
    Mongo_StateManager
};