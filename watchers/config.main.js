const config = {

    chain: {
        chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
        httpEndpoint: "http://history.cryptolions.io"
    },

    db: {
        mongoUrl: 'mongodb://localhost:27017/',
        dbName: 'eosdac'
    },

    contracts:{
        custodian: 'daccustodian',
        token: 'eosdactokens',
        msig: 'dacmultisigs',
        systemmsig: 'eosio.msig'
    }

}

module.exports = {
    config
};