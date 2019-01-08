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
            let a = await state.db.collection('balances').updateOne(
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
            let data = getDefaultData(actiondata);
            data.from = actiondata.act.data.from;
            data.to = actiondata.act.data.to;
            data.quantity = actiondata.act.data.quantity;
            data.quantity2 = amount;
            data.receiver = actiondata.receipt.receiver;
            data.recv_sequence = actiondata.receipt.recv_sequence;
            data.account = actiondata.act.account;
            
            // let c = await state.db.collection('transfers').updateOne(
            //     { recv_sequence: data.recv_sequence },
            //     { $set: data},
            //     { upsert: true }
            // );

            let c = await state.db.collection('transfers').insertOne(data);

            // if(c.result.upserted){
                let a = await state.db.collection('balances').updateOne(
                    { _id: actiondata.act.data.from }, 
                    { $inc: { quantity: -amount } }, 
                    { upsert: true } 
                );

                let b = await state.db.collection('balances').updateOne(
                    { _id: actiondata.act.data.to }, 
                    { $inc: { quantity: amount } }, 
                    { upsert: true } 
                );
            // }

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
        // console.log(actiondata)
        //init data object
        let data = {};
        data._id = actiondata.trx_id; //add id
        data.proposer = actiondata.act.data.proposer;
        data.proposal_name = actiondata.act.data.proposal_name;
        data.irreversible = actiondata.irreversible;
        data.status = 1; // 0:cancelled; 1:active; 2:executed !important!

        //query chain...
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
            }) ).rows[0],

            (await eos.rpc.get_table_rows({
                code: config.contracts.custodian,
                json: true,
                limit: 1,
                scope: config.contracts.custodian,
                table: 'config'
            }) ).rows[0]
        ]
        //...resolve promises
        let [proposal, votes, cust_config] =  await Promise.all(proms);
        if(!proposal || !votes || !cust_config) return false;
        // console.log(cust_config)
        
        //set meta data
        let metadata =IsJsonString(actiondata.act.data.metadata)? JSON.parse(actiondata.act.data.metadata): {title:'', description:''};
        data.title = metadata.title;
        data.description = metadata.description;

        //set requested and provided approvals/votes
        data.provided_approvals = votes.provided_approvals;
        data.requested_approvals = votes.requested_approvals;
        data.custodianboard = [...votes.provided_approvals, ...votes.requested_approvals];

        //set unpacked transaction + actions
        let unpackedtrx = eos.deserializeTransaction(Serialize.hexToUint8Array(proposal.packed_transaction) );
        unpackedtrx.actions = await eos.deserializeActions(unpackedtrx.actions);
        data.trx = unpackedtrx;

        //get authorization from each action actor@permission
        let auths = [].concat(...data.trx.actions.map(a=> a.authorization) ).map(b => b.actor+'@'+b.permission);
        //remove duplicates
        auths = Array.from(new Set(auths) );

        //get threshold for each authorization
        const threshold_map = {active: cust_config.auth_threshold_high, low: cust_config.auth_threshold_low, med: cust_config.auth_threshold_mid, high: cust_config.auth_threshold_high, one: 1};
        ///////////////////////////////////////////////////////////////////////
        let ta = [];
        for(let i = 0; i < auths.length; i++){
            [actor, permission] = auths[i].split('@');
            
            if(actor == cust_config.authaccount){
                ta.push(threshold_map[permission])
            }
            else{
                let perm = (await eos.rpc.get_account(actor)  ).permissions;
                perm = perm.find(p => p.perm_name == permission);
                perm = perm.required_auth.accounts.find(x => x.permission.actor == cust_config.authaccount);
                perm = perm.permission.permission;
                // console.log(util.inspect(perm, false, null, true))
                ta.push(threshold_map[perm]);
            }

        }
        //find highest required threshold
        data.threshold = Math.max(...ta);
        // console.log(util.inspect(data, false, null, true));
        let c = await state.db.collection('msigproposals').updateOne(
            {_id: data._id },
            {$set: data},
            { upsert: true }
        );
        return true;
    },

    // approved : async (actiondata, state) => {
       
    // },

    // unapproved : async (actiondata, state) => {
       
    // },

    executed : async (actiondata, state) => {
        // console.log(actiondata.act.data.proposer, actiondata.act.data.proposal_name);
        let c = await state.db.collection('msigproposals').updateOne(
            {proposer: actiondata.act.data.proposer, proposal_name: actiondata.act.data.proposal_name, status:1 },
            {$set: {status:2} },
            { upsert: true }
        );
        return true;
    },

    cancelled : async (actiondata, state, eos) => {
        // console.log(actiondata.act.data.proposer, actiondata.act.data.proposal_name);
        let c = await state.db.collection('msigproposals').updateOne(
            {proposer: actiondata.act.data.proposer, proposal_name: actiondata.act.data.proposal_name, status:1 },
            {$set: {status:0} },
            { upsert: true }
        );
        return true;
       
    }
}

module.exports = {
    custodianHandler,
    tokenHandler,
    msigHandler
};