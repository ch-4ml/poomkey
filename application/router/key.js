const keyModel = require('../model/key');

// ExpressJS Setup
const express = require('express');
const keyRouter = express.Router();

// Hyperledger Bridge
const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'network' ,'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

keyRouter.get('/key', (req, res)=>{
    let data;
    data = { user: req.session.user }
    res.render('registerKey', {data: data});
});

// 새로운 키 등록
keyRouter.post('/key', async (req, res) => {
    let data;
    try {
        /* 
            블록체인에 올라갈 Key Data
            {
                "index": "DB에 저장된 index"
                "key" : "제품키",
                "name" : "제품 이름",
                "owner" : "제품키 소유자",
                "validity" : "제품키 사용 가능 기간",
            }
        */
    /* ------------------- REQUESTED DATA -------------------- */
        var key = req.body.key;
        var name = req.body.name;
        var owner = req.session.user.index;
        var validity = req.body.validity;
    /* ------------------- REQUESTED DATA -------------------- */

    /* ------------------- DATABASE ACCESS ------------------- */
        let keyData = { name, owner, validity }    
        let result = await keyModel.setKey(keyData);
        let id = result[0]['insertId'];
    /* ------------------- DATABASE ACCESS ------------------- */

    /* ------------------- CHAINCODE ACCESS ------------------ */
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } }); 

        const network = await gateway.getNetwork('mychannel');

        const contract = network.getContract('sacc');

        await contract.submitTransaction("setKey", id.toString(), key.toString(), name.toString(), owner.toString(), validity.toString());
        await gateway.disconnect();
        console.log("Transaction has been submitted")
    /* ------------------- CHAINCODE ACCESS ------------------ */
    
    /* ----------------------- RESPONSE ---------------------- */
        // res.status(200).json({response: 'Transaction has been submitted'});
        data = { user: req.session.user }
        res.render('index', {data: data})
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(400).json(error);
    }
    /* ----------------------- RESPONSE ---------------------- */
});

// 모든 키 조회
let data;
keyRouter.get('/keys', async (req, res) => {
    try {
    /* ------------------- CHAINCODE ACCESS ------------------ */
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        const userExists = await wallet.exists('user1');

        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        const network = await gateway.getNetwork('mychannel');
        
        const contract = network.getContract('sacc');
        const result = await contract.evaluateTransaction('getAllKeys');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        /* ------------------- CHAINCODE ACCESS ------------------ */
        var obj = JSON.parse(result);

        for(var i=0; i<obj.length; i++){
            obj[i]['poomId'] = parseInt(obj[i]['poomId'])
        }
        if(obj.length > 1) {
            obj.sort(function(a, b) { // 오름차순
                return a['poomId'] - b['poomId'];
                // 13, 21, 25, 44
            });
        }
        console.log(obj)
        data = { data: obj, user: req.session.user }
        res.render('getAllKeys', { data: data });
    } catch(error) {
        console.error(`Failed: ${error}`);
        res.status(400).json(error);
    }
});

// Owner로 키 조회
keyRouter.get('/keys/owner', async (req, res) => {
    let data;
    try {
        var owner = req.session.user.index;
    /* ------------------- CHAINCODE ACCESS ------------------ */
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('sacc');
        const result = await contract.evaluateTransaction('getKeysByOwner', owner.toString());
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        var obj = JSON.parse(result)
        for(var i=0; i<obj.length; i++){
            obj[i]['poomId'] = parseInt(obj[i]['poomId'])
        }
        if(obj.length > 1) {
            obj.sort(function(a, b) { // 오름차순
                return a['poomId'] - b['poomId'];
                // 13, 21, 25, 44
            });
        }
        data = { data: obj, user: req.session.user };
    /* ------------------- CHAINCODE ACCESS ------------------ */
        res.render('getMyKeys', {data: data});
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(400).json(`{response: ${error}`);
    }
});

// 키 소유권 변경 페이지
keyRouter.get('/key/owner/:index', async (req, res) => {
    let data;
    data = { data: req.params.index, user: req.session.user }
    res.render('changeKeyOwner', {data: data})
})

// 키 소유권 변경
keyRouter.post('/key/owner', async (req, res) => {
    let data;
    try {
        var poomKeyIndex = req.body.poomKeyIndex;
        var owner = req.session.user.index;
        var newOwner = req.body.newOwner;

        var key = {
            owner : req.session.user.index,
            keyIndex : poomKeyIndex
        }

        let index = await keyModel.changeKeyOwner(key);
        index = index[0];
        console.log(index)
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });

        const network = await gateway.getNetwork('mychannel');

        const contract = network.getContract('sacc');
        await contract.submitTransaction('changeKeyOwner', poomKeyIndex.toString(), owner.toString(), newOwner.toString());
        await gateway.disconnect();
        // res.status(200).json({response: 'Transaction has been submitted'});
        data = { user: req.session.user }
        res.render('index', {data: data});
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(400).json(error);
    }
});

keyRouter.get('/key/history', (req, res)=>{
    let data;
    data = { user: req.session.user }
    res.render('historyByKey', {data: data});
});

// key id로 history 조회
keyRouter.post('/key/history', async (req, res) => {
    let data;
    try {
        var poomKeyIndex = req.body.poomKeyIndex;
        
        // let index = await keyModel.changeKeyOwner(key);
        // index = index[0];
        // console.log(index)
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });

        const network = await gateway.getNetwork('mychannel');

        const contract = network.getContract('sacc');
        const result = await contract.submitTransaction('getHistoryByKey', poomKeyIndex.toString());
        await gateway.disconnect();

        var obj = JSON.parse(result)
        data = { data: obj, user: req.session.user };
        res.render('getMyKeyHistory', { data: data });
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(400).json(error);
    }
});

module.exports = keyRouter;