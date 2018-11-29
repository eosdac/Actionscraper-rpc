const daccustodian = {

    account_name : 'daccustodian',

    // votecust : async (actiondata, state, eosapi) => {

    //     await state.db.collection('votes').updateOne({ _id: actiondata._id }, {$set:actiondata}, { upsert: true } );
    // },
    stprofileuns : async (actiondata, state) => {
        if(actiondata.act.account == 'daccustodian'){
            let id = actiondata.act.data.cand;
            let data = {};
            data.profile = actiondata.act.data.profile;
            data.is_irr = actiondata.irreversible;
            data.blocknum = actiondata.block_num;
            data.blocktime = actiondata.block_time;
            data.globseq = actiondata.receipt.global_sequence;
            await state.db.collection('profiles3').updateOne({ _id: actiondata.act.data.cand }, {$set:data}, { upsert: true } );
        }
        
    }
}

module.exports = {
    daccustodian
};