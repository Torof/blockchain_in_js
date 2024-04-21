var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const port = process.argv[2];
const rp = require('request-promise');

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

app.post('/transaction/broadcast', function(req, res){
    const newTransaction = ethereum.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    ethereum.addTransactionToPendingTransactions(newTransaction);

    ethereum.networkNodes.forEach(networkNodeUrl => {
        
    })
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

app.post('/register-and-broadcast-node', function(req,res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (ethereum.networkNodes.indexOf(newNodeUrl) == -1) ethereum.networkNodes.push(newNodeUrl);

    const regNodesPromises = [];
    ethereum.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl},
            json: true
        };

        regNodesPromises.push(rp(requestOptions));
    });

    Promise.all(regNodesPromises)
    .then(data => {
        const bulkRegisterOptions = {
            uri: newNodeUrl + '/register-nodes-bulk',
            method: 'POST',
            body: { allNetworkNodes: [ ...ethereum.networkNodes, ethereum.currentNodeUrl]},
            json: true
        };

        return rp(bulkRegisterOptions);
    })
    .then(data => {
        res.json({note: 'New node registered succesfully with network'})
    });
});

app.post('/register-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = ethereum.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = ethereum.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) ethereum.networkNodes.push(newNodeUrl);
    res.json({ note: 'new node successfully registered'});

});

// register multiple nodes at once
app.post('/register-nodes-bulk', function(req, res) {
	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl => {
		const nodeNotAlreadyPresent = ethereum.networkNodes.indexOf(networkNodeUrl) == -1;
		const notCurrentNode = ethereum.currentNodeUrl !== networkNodeUrl;
		if (nodeNotAlreadyPresent && notCurrentNode) ethereum.networkNodes.push(networkNodeUrl);
	});

	res.json({ note: 'Bulk registration successful.' });
});

app.listen(port, function(){
    console.log(`listening on port ${port}...`)
})