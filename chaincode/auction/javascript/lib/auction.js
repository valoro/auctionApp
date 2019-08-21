/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const {Contract} = require('fabric-contract-api');

class Auction extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const cars = [
            {
                color: 'blue',
                make: 'Toyota',
                model: 'Prius',
                owner: 'Tomoko',
            }
        ];

        for (let i = 0; i < cars.length; i++) {
            cars[i].docType = 'car';
            await ctx.stub.putState('CAR' + i, Buffer.from(JSON.stringify(cars[i])));
            console.info('Added <--> ', cars[i]);
        }

        console.info('============= END : Initialize Ledger ===========');
    }
    async createUser(ctx, firstName, lastName) {

        console.info('============= Create User ===========');
        const userId=ctx.stub.getTxTimestamp().seconds.low.toString();

        if (!firstName || !lastName) {
            throw new Error('Name is required to register a new user');
        }
        const person = {
            firstName,
            lastName
        };

        await ctx.stub.putState('user' + userId, Buffer.from(JSON.stringify(person)));
        console.info('userId:',userId,'user:',person);

        console.info('============= End Create User ===========');

        return { userId: userId, user: person };
    }
    async createLand(ctx, userId, information) {

        console.info('============= Create Land ===========');
        const landId=ctx.stub.getTxTimestamp().seconds.low.toString();

        if ( !information) {
            throw new Error('Please enter the necessary information...');
        }
        const land = {
            information,
            userId
        };
        const checkOwner = await ctx.stub.getState('user'+userId);

        if (!checkOwner || checkOwner.length === 0) {
            throw new Error(`land owner with ${userId} does not exist`);
        }
        const owner = JSON.parse(checkOwner.toString());
        console.info(owner);
        await ctx.stub.putState('land' + landId, Buffer.from(JSON.stringify(land)));
        console.info('landId: ', landId,'land: ',land);
        console.info('============= End Create Land ===========');
        return { landId: landId, landVal: land };
    }
    async createBid(ctx, userId , amount , aucId ){
        
        const bidId = await ctx.stub.getTxTimestamp().seconds.low.toString();
        const aucBits = await ctx.stub.getState('auc'+aucId);
        if (!aucBits || aucBits.length === 0) {
            throw new Error(`auction with ${aucId} does not exist`);
        }
        const userBits = await ctx.stub.getState('user'+userId);
        if(!userBits || userBits.length === 0){
            throw new Error(`user with ID ${userId} does not exist`);
        }
        const auc = JSON.parse(aucBits.toString());
        if(parseInt(bidId)>parseInt(auc.endingTime))
        {
            await ctx.stub.putState('aucId'+aucId ,Buffer.from(JSON.stringify(auc)));
            return console.log('auction has ended');
        }
        if (parseInt(amount) < parseInt(auc.maxBid))
        {
            throw new Error(`amount ${amount} is less than the current bid ${auc.maxBid}`);
        }
        const bidVal =
        {
            userId,
            amount,
            aucId
        };
        
        auc.maxBiderId = userId;
        auc.maxBid = amount;
        await ctx.stub.putState('auc'+aucId, Buffer.from(JSON.stringify(auc)));
        await ctx.stub.putState('bid'+bidId, Buffer.from(JSON.stringify(bidVal)));
        console.log('bidId: ',bidId,'bid: ',bidVal);
        return { bidId: bidId , bid : bidVal};
    }
    async createAuction(ctx,userId,landId,minBid){

        const landBits = await ctx.stub.getState('land'+landId);
        if (!landBits || landBits.length === 0) {
            throw new Error(`land with ID ${landId} does not exist`);
        }
        const userBits = await ctx.stub.getState('user'+userId);
        if(!userBits || userBits.length === 0){
            throw new Error(`user with ID ${userId} does not exist`);
        }
        const land = JSON.parse(landBits.toString());
        const landOwner = land.userId;
        if (landOwner !== userId)
        {
            throw new Error(`this user with ID ${userId} is not the owner of the land with ID ${landId}`);
        }

        let maxBid = minBid;
        console.log('maxBid: ',maxBid);
        const aucId = ctx.stub.getTxTimestamp().seconds.low.toString();
        console.log('audIc: ',aucId);
        const endingTime = parseInt(aucId)+ 3600;
        console.log('ending time: ',endingTime);
        const maxBiderId = 0;
        const aucVal =
        {
            state: 'open' ,
            maxBid,
            maxBiderId,
            endingTime,
            landId
        };
        console.log('aucId: ',aucId,'auc is: ', aucVal);
        await ctx.stub.putState('auc'+aucId,Buffer.from(JSON.stringify(aucVal)));
        return {aucId : aucId, Val : aucVal};
    }
    async transferProperty(ctx,aucId,bidId){
        const aucBits = await ctx.stub.getState('aucId'+aucId);
        if (!aucBits || aucBits.length === 0) {
            throw new Error(`auction with ${aucId} does not exist`);
        }
        const auc = JSON.parse(toString(aucBits));

        const bidBits = await ctx.stub.getState('bidId'+bidId);
        if (!bidBits || bidBits.length === 0) {
            throw new Error(`bid with ${bidId} does not exist`);
        }
        const bid = JSON.parse(toString(bidBits));

        auc.state='closed';
        auc.asset.owner=bid.user;

        await ctx.stub.putState(aucId, Buffer.from(JSON.stringify(auc)));

    }
async queryUser(ctx, userId) { return queryAsset(ctx, 'user' + userId, 'user'); }
    async queryLand(ctx, landId) { return queryAsset(ctx, 'land' + landId, 'land'); }
    async queryAuction(ctx, aucId) { return queryAsset(ctx, 'auc' + aucId, 'auction'); }
    async queryBid(ctx, bidId) { return queryAsset(ctx, 'bid' + bidId, 'bid'); }

    async queryAllUsers(ctx) { return queryAllAsset(ctx,'user') };
    async queryAllLand(ctx) { return queryAllAsset(ctx,'land') };
    async queryAllAuctions(ctx) { return queryAllAsset(ctx,'auc') };
    async queryAllBids(ctx) { return queryAllAsset(ctx,'bid') };

    async queryUserByProp(ctx,propType,propValue){return queryAssetByOneProp(ctx,propType,propValue);}
    async queryLandByProp(ctx,propType,propValue){return queryAssetByOneProp(ctx,propType,propValue);}
    async queryAuctionByProp(ctx,propType,propValue){return queryAssetByOneProp(ctx,propType,propValue);}
    async queryBidByProp(ctx,propType,propValue){return queryAssetByOneProp(ctx,propType,propValue);}

    async queryUserByTwoProps(ctx,prop1Type,prop1Value,prop2Type,prop2Value){return queryAssetByTwoProps(ctx,prop1Type,prop1Value,prop2Type,prop2Value); }
    async queryLandByTwoProps(ctx,prop1Type,prop1Value,prop2Type,prop2Value){return queryAssetByTwoProps(ctx,prop1Type,prop1Value,prop2Type,prop2Value); }
    async queryAuctionByTwoProps(ctx,prop1Type,prop1Value,prop2Type,prop2Value){return queryAssetByTwoProps(ctx,prop1Type,prop1Value,prop2Type,prop2Value); }
    async queryBidByTwoProps(ctx,prop1Type,prop1Value,prop2Type,prop2Value){return queryAssetByTwoProps(ctx,prop1Type,prop1Value,prop2Type,prop2Value); }

    async updateUser(ctx,userId,newProparties){return updateAsset(ctx,'user'+userId,newProparties,'user');}
    async updateLand(ctx,landId,newProparties){return updateAsset(ctx,'land'+landId,newProparties,'land');}
    async updateAuction(ctx,aucId,newProparties){return updateAsset(ctx,'auc'+aucId,newProparties,'auction');}
    async updateBid(ctx,bidId,newProparties){return updateAsset(ctx,'bid'+bidId,newProparties,'bid');}

    async deleteUser(ctx,userId) { return deleteAsset(ctx, 'user'+userId, 'user');}
    async deleteUser(ctx,landId) { return deleteAsset(ctx, 'land'+landId, 'land');}
    async deleteUser(ctx,aucId) { return deleteAsset(ctx, 'auc'+aucId, 'auction');}
    async deleteUser(ctx,bidId) { return deleteAsset(ctx, 'bid'+bidId, 'bid');}
}
    
async function queryAsset(ctx, key, type) {
    const assetAsBytes = await ctx.stub.getState(key); // get the car from chaincode state
    if (!assetAsBytes || assetAsBytes.length === 0) {
        throw new Error(`${type} with key: ${key} does not exist`);
    }
    console.log(assetAsBytes.toString());
    return (JSON.parse(assetAsBytes.toString()));
}

async function queryAllAsset(ctx, key) {
    const startKey = key.toLowerCase() + '0';
    const endKey = key.toLowerCase() + '99999999999';
    const iterator = await ctx.stub.getStateByRange(startKey, endKey);
    const allResults = [];
    while (true) {
        const res = await iterator.next(); 
        if (res.value && res.value.value.toString()) {
            console.log(res.value.value.toString('utf8'));
            const Key = res.value.key;
            let Record;
            try {
                Record = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
                console.log(err);
                Record = res.value.value.toString('utf8');
            }
            allResults.push({ Key, Record });
        }
        if (res.done) {
            console.log('end of data');
            await iterator.close();
            console.info(allResults);
            return JSON.stringify(allResults);
        }
    }
}
async function queryAssetByTwoProps(ctx, propType, propValue,docType,docValue) {
    let selector = `{ "selector": { "${propType}": "${propValue}" }, { "${docType}": "${docValue}" } };`
    console.info(selector);
    const iterator = await ctx.stub.getQueryResult(selector);
    const allResults = [];
    while (true) {
        const res = await iterator.next(); if (res.value && res.value.value.toString()) {
            console.log(res.value.value.toString('utf8')); const Key = res.value.key;
            let Record;
            try {
                Record = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
                console.log(err);
                Record = res.value.value.toString('utf8');
            }
            allResults.push({ Key, Record });
        }
        if (res.done) {
            console.log('end of data');
            await iterator.close();
            console.info(allResults);
            if (!propType || !propValue || !docType || !docValue) {
                return allResults.length;
            }
            else {
                return JSON.stringify(allResults);
            }
        }
    }
}
async function queryAssetByOneProp(ctx, propType, propValue) {
    let selector = `{ "selector": { "${propType}": "${propValue}" } };`
    console.info(selector);
    const iterator = await ctx.stub.getQueryResult(selector);
    const allResults = [];
    while (true) {
        const res = await iterator.next(); if (res.value && res.value.value.toString()) {
            console.log(res.value.value.toString('utf8')); const Key = res.value.key;
            let Record;
            try {
                Record = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
                console.log(err);
                Record = res.value.value.toString('utf8');
            }
            allResults.push({ Key, Record });
        }
        if (res.done) {
            console.log('end of data');
            await iterator.close();
            console.info(allResults);
            if (!propType || !propValue ) {
                return allResults.length;
            }
            else {
                return JSON.stringify(allResults);
            }
        }
    }
}
async function updateAsset(ctx, key, newProparties,type) {
    const assetAsBytes = await ctx.stub.getState(key);
    if (!assetAsBytes || assetAsBytes.length === 0) {
        throw new Error(`${type} ${key} does not exist`);
    }
    const asset = JSON.parse(assetAsBytes.toString()); let errorFlag = true; try {
        newProparties = JSON.parse(newProparties);
    } catch (error) {
        throw new Error(`error ${error} parsing newProparties ${newProparties} to JSON, please enter right format`);
    } const newEntries = Object.entries(newProparties);
    if (!newEntries || newEntries.length === 0) {
        throw new Error('new proparties must be have at least one argument');
    }
    const keys = Object.keys(asset); for (const [newKey, newValue] of newEntries) {
        for (const subKey of keys) {
            if (subKey === newKey) {
                asset[subKey] = newValue;
                errorFlag = false;
            }
        }
        if (errorFlag) {
            throw new Error(`error in updating ${type}: ${key}, key: ${newKey} is not a property of the ${type}!`);
        }
        errorFlag = true;
    }
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(asset)));
    console.log(`${type} updated`);
    return JSON.stringify({ key: key, asset });
}
async function deleteAsset(ctx, key,type) {
    const assetAsBytes = await ctx.stub.getState(key);
    if (!assetAsBytes || assetAsBytes.length === 0) {
        throw new Error(`${type} ${key} does not exist`);
    }
    await ctx.stub.deleteState(key);
    console.log(`${type} deleted`);
    return key;
}



module.exports = Auction;
