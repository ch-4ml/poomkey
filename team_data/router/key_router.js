const keyModel = require('../model/key_model');

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

// 키 등록
keyRouter.post('/key', async (req, res) => {
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
        var key = req.body.key;
        var name = req.body.name;
        var owner = req.body.owner;
        var validity = req.body.validity;

        // Key 등록 들어갈 자리 (DB)
        let keyData = {
            name: name,
            owner: owner,
            validity: validity
        }

        let index = await keyModel.setKey(keyData);
        index = index[0][0]['insertId'];
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

        await contract.submitTransaction('set', index, key, name, owner, validity);
        console.log('Transaction has been submitted');
        await gateway.disconnect();

        res.status(200).json({response: 'Transaction has been submitted'});

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(400).json(error);
    }
});

keyRouter.post('/getKey', async (req, res) => {
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

    var obj = JSON.parse(result);
    res.status(200).json(obj);
});

keyRouter.get('/key/:index', async (req, res) => {
    try {
        var index = req.params.index;
        console.log(index);

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
        const result = await contract.evaluateTransaction('get', index);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        var obj = JSON.parse(result)
        res.status(200).json(obj);

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(400).json(`{response: ${error}`);
    }
});

keyRouter.put('/key', async (req, res) => {
    try {
        var fromIndex = req.session.user.index;
        var toIndex = req.body.toIndex;
        var poomKeyIndex = req.body.poomKeyIndex;

        var dbKeyData = {
            owner : dbKeyData,
            keyIndex : poomKeyIndex
        }

        let index = await keyModel.chageOwnerKey(dbKeyData);
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
        await contract.submitTransaction('changeKeyOwner', poomKeyIndex, fromIndex, toIndex);
        await gateway.disconnect();
        res.status(200).json({response: 'Transaction has been submitted'});
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(400).json(error);
    }
});

module.exports = keyRouter;