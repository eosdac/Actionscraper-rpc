const daccustodian = {

    account_name : 'daccustodian',

    // votecust : async (actiondata, state, eosapi) => {

    //     await state.db.collection('votes').updateOne({ _id: actiondata._id }, {$set:actiondata}, { upsert: true } );
    // },
    stprofileuns : async (actiondata, state) => {
       
            let id = actiondata.act.data.cand;
            let data = {};
            data.profile = actiondata.act.data.profile;
            data.irreversible = actiondata.irreversible;
            data.block_num = actiondata.block_num;
            data.block_time = actiondata.block_time;
            data.action_name = actiondata.act.name; // = stprofileuns
            data.global_sequence = actiondata.receipt.global_sequence;
            await state.db.collection('profiles').updateOne({ _id: id }, {$set:data}, { upsert: true } );
    }
}

module.exports = {
    daccustodian
};