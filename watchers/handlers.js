const {config} = require('./config');

//helper function to extract required default data from action.
function getDefaultData(actiondata){
    let data = {};
    data.irreversible = actiondata.irreversible;
    data.block_num = actiondata.block_num;
    data.block_time = actiondata.block_time;
    data.action_name = actiondata.act.name; // = stprofileuns
    data.global_sequence = actiondata.receipt.global_sequence;
    data.txid = actiondata.trx_id;
    return data;
}

/////////////////////////////////////
//handler for custodian contract
/////////////////////////////////////
const custodiancontract = {

    account_name : config.contracts.custodian,

    stprofileuns : async (actiondata, state) => {
       
            let id = actiondata.act.data.cand;
            let data = getDefaultData(actiondata);
            data.profile = actiondata.act.data.profile;
            await state.db.collection('profiles').updateOne({ _id: id }, {$set:data}, { upsert: true } );
    }
}

/////////////////////////////////////
//handler for token contract
/////////////////////////////////////
const tokencontract = {

    account_name : config.contracts.token,

    issue : async (actiondata, state) => {
       
    }
}

module.exports = {
    custodiancontract,
    tokencontract
};