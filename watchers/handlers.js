const {config} = require('./config');
const util = require('util');
const { Serialize } = require('eosjs');

//helper function to extract required default data from action.
function getDefaultData(actiondata){
    let data = {};
    data.irrevirsible = actiondata.irreversible;
    data.block_num = actiondata.block_num;
    data.block_time = actiondata.block_time;
    data.action_name = actiondata.act.name; // = stprofileuns
    data.global_sequence = actiondata.receipt.global_sequence;
    data.txid = actiondata.trx_id;
    return data;
}
function IsJsonString(str) {
    try {
      var json = JSON.parse(str);
      return (typeof json === 'object');
    } catch (e) {
      return false;
    }
}
function getBalance(asset){
    let amount = asset.split(' ');
    return parseInt((parseFloat(amount)*10000).toFixed(0))

}


/////////////////////////////////////
//handler for custodian contract
/////////////////////////////////////
const custodianHandler = {

    account_name : config.contracts.custodian,

    stprofileuns : async (actiondata, state) => {
       
            let id = actiondata.act.data.cand;
            let data = getDefaultData(actiondata);
            data.profile = JSON.parse(actiondata.act.data.profile);
            await state.db.collection('profiles').updateOne({ _id: id }, {$set:data}, { upsert: true } );
            return true;
            
    }
}

/////////////////////////////////////
//handler for token contract
/////////////////////////////////////
const tokenHandler = {

    account_name : config.contracts.token,

    issue : async (actiondata, state) => {
        if(actiondata.irreversible){
            let a = await state.db.collection('balances2').updateOne(
                { _id: actiondata.act.data.to }, 
                { $inc: { quantity: getBalance(actiondata.act.data.quantity) } }, 
                { upsert: true } 
            );
            return true;
        }
    },

    transfer : async (actiondata, state) => {
        if(actiondata.irreversible){
            let amount =  getBalance(actiondata.act.data.quantity);
            //do something with irreversible transfer
            let data = getDefaultData(actiondata)
            data.from = actiondata.act.data.from;
            data.to = actiondata.act.data.to;
            data.quantity = actiondata.act.data.quantity;
            data.receiver = actiondata.receipt.receiver;
            data.recv_sequence = actiondata.receipt.recv_sequence;
            data.account = actiondata.act.account;
            
            

            let c = await state.db.collection('transfers3').updateOne(
                {recv_sequence: data.recv_sequence },
                {$set: data},
                { upsert: true }
            );

            if(c.result.upserted){
                let a = await state.db.collection('balances3').updateOne(
                    { _id: actiondata.act.data.from }, 
                    { $inc: { quantity: -amount } }, 
                    { upsert: true } 
                );
                let b = await state.db.collection('balances3').updateOne(
                    { _id: actiondata.act.data.to }, 
                    { $inc: { quantity: amount } }, 
                    { upsert: true } 
                );
            }

            return true;
        }

    }
}

/////////////////////////////////////
//handler for msig contract
/////////////////////////////////////
const msigHandler = {

    account_name : config.contracts.msig,

    proposed : async (actiondata, state, eos) => {

        let data = {};
        data._id = actiondata.trx_id;
        data.proposer = actiondata.act.data.proposer;
        data.proposal_name = actiondata.act.data.proposal_name;
        
        let proms = [

            (await eos.rpc.get_table_rows({
                code: 'eosiomsigold',
                json: true,
                limit: 1,
                lower_bound: data.proposal_name,
                scope: data.proposer,
                table: 'proposal'
            }) ).rows[0],

            (await eos.rpc.get_table_rows({
                code: 'eosiomsigold',
                json: true,
                limit: 1,
                lower_bound: data.proposal_name,
                scope: data.proposer,
                table: 'approvals'
            }) ).rows[0]
        ]
        
        let [proposal, votes] =  await Promise.all(proms);
        if(!proposal && !votes){
            return false;
        }
        data.provided_approvals = votes.provided_approvals;
        data.requested_approvals = votes.requested_approvals;

        let unpackedtrx = eos.deserializeTransaction(Serialize.hexToUint8Array(proposal.packed_transaction) );
        unpackedtrx.actions = await eos.deserializeActions(unpackedtrx.actions);
        data.trx = unpackedtrx;
        console.log(data)
    },

    approved : async (actiondata, state) => {
       
    },

    unapproved : async (actiondata, state) => {
       
    },

    executed : async (actiondata, state) => {
       
    },

    cancelled : async (actiondata, state) => {
       
    }
}

module.exports = {
    custodianHandler,
    tokenHandler,
    msigHandler
};