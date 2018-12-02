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

const daccustodian = {

    account_name : 'dacelections',

    stprofileuns : async (actiondata, state) => {
       
            let id = actiondata.act.data.cand;
            let data = getDefaultData(actiondata);
            data.profile = actiondata.act.data.profile;
            await state.db.collection('profiles').updateOne({ _id: id }, {$set:data}, { upsert: true } );
    }
}

module.exports = {
    daccustodian
};