var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');

const ethereum = new Blockchain;
const nodeAddress = uuid().split('-').join('');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


app.get('/blockchain', function(req, res) {
    res.send(ethereum);
});

app.post('/transaction', function(req, res) {
    const blockIndex = ethereum.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);   
    res.json({ note: `Transaction of ${req.body.amount} eth will be added to block ${blockIndex}`});
});

app.get('/mine', function(req, res) {
    const lastBlock = ethereum.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: ethereum.pendingTransactions,
        index: lastBlock['index'] + 1
    };
    const nonce = ethereum.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = ethereum.hashBlock(previousBlockHash, currentBlockData, nonce)

    ethereum.createNewTransaction(12.5, "00", nodeAddress);

    const newBlock = ethereum.createNewBlock(nonce, previousBlockHash, blockHash);
    res.json({
        note: "New block mined successfully",
        block: newBlock
    })
});

app.listen(3000, function(){
    console.log('listening on port 3000...')
})