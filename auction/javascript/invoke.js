/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('auction');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        let a = await contract.submitTransaction('createUser','kariiiiiiiiiiiiiiiiiiiiiiim','hashem');
        console.log(JSON.parse(a.toString()));
        let a2 = await contract.submitTransaction('createUser','ali','selim');
        let a3 = await contract.submitTransaction('createUser','akram','yehia');
        try {
            let a4 = await contract.submitTransaction('createUser','ali' , '');            
        } catch (error) {
            console.log(error);
            console.log('error expected, continue ...');
        }
        try {
            let a5 = await contract.submitTransaction('createUser','ali' );            
        } catch (error) {
            console.log(error);
            console.log('error expected, continue ...');
        }
        console.log(JSON.parse(a2.toString()));
        console.log(JSON.parse(a3.toString()));
        let b = await contract.submitTransaction('createLand',JSON.parse(a.toString()).userId,'big');
        console.log(JSON.parse(b.toString()));
        let b2 = await contract.submitTransaction('createLand',JSON.parse(a2.toString()).userId,'small');
        console.log(JSON.parse(b2.toString()));
        try {
            let b3 = await contract.submitTransaction('createLand','1547764' , 'asd');            
        } catch (error) {
            console.log(error);
            console.log('error expected, continue ...');
        }
        try {
            let b4 = await contract.submitTransaction('createLand',JSON.parse(a3.toString()) , '');            
        } catch (error) {
            console.log(error);
            console.log('error expected, continue ...');
        }
        let au = await contract.submitTransaction('createAuction',JSON.parse(a.toString()).userId , JSON.parse(b.toString()).landId, '10000');
        console.log(JSON.parse(au.toString()));
        try {
            let au2 = await contract.submitTransaction('createAuction',JSON.parse(a3.toString()).userId , JSON.parse(b2.toString()).landId, '1');            
        } catch (error) {
            //console.log(error.details[0].message);
            console.log('error expected, continue ...');
        }
        let bi = await contract.submitTransaction('createBid',JSON.parse(a2.toString()).userId,'10500',JSON.parse(au.toString()).aucId);
        try{let bi2 = await contract.submitTransaction('createBid',JSON.parse(a2.toString()).userId,'10400',JSON.parse(au.toString()).aucId);
        }catch(error)
        {
            //console.log(error);
            console.log('expected error...');
        }   
        let bi3 = await contract.submitTransaction('createBid',JSON.parse(a3.toString()).userId,'10501',JSON.parse(au.toString()).aucId);
        console.log(JSON.parse(bi.toString()));
        console.log(JSON.parse(au.toString()));
        let x = await contract.evaluateTransaction('queryAuction',JSON.parse(au.toString()).aucId);
        console.log(JSON.parse(x.toString()));
        console.log(JSON.parse(bi3.toString()));
        console.log('Transaction has been submitted');

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
