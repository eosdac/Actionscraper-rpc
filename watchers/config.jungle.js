const config = {

    chain: {
        chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473",
        httpEndpoint: "http://junglehistory.cryptolions.io"
    },

    db: {
        mongoUrl: 'mongodb://localhost:27017/',
        dbName: 'dac'
    },

    contracts:{
        custodian: 'daccustodia1',
        token: 'dactoken1111',
        msig: 'dacmultisig1',
        systemmsig: 'eosiomsigold'
    }

}

module.exports = {
    config
};