// This script pulls pool info from dexes that are on various chains and
// checks if there is a change(e.g. weight, rewarder contract) on pools or if there is a new farm.

require("dotenv").config({path: "../.env"});
const CONFIG = require("../config/config.js");
const Web3 = require("web3");

//  ---------------------------------------- RPCs ----------------------------------------
//  RPC URLs for web3 calls.

//const ethereumWeb3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3")); **The url doesn't work.
const avalancheWeb3 = new Web3(new Web3.providers.HttpProvider("https://api.avax.network/ext/bc/C/rpc"));
const bscWeb3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org"));
const polygonWeb3 = new Web3(new Web3.providers.HttpProvider("https://polygon-rpc.com"));
const fantomWeb3 = new Web3(new Web3.providers.HttpProvider("https://rpc.ftm.tools"));
const harmonyWeb3 = new Web3(new Web3.providers.HttpProvider("https://api.harmony.one"));
const cronosWeb3 = new Web3(new Web3.providers.HttpProvider("https://evm.cronos.org"));
const auroraWeb3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.aurora.dev/"));
const moonriverWeb3 = new Web3(new Web3.providers.HttpProvider("https://rpc.moonriver.moonbeam.network"));
const moonbeamWeb3 = new Web3(new Web3.providers.HttpProvider("https://rpc.api.moonbeam.network"));
const bobaWeb3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.boba.network"));
const kccWeb3 = new Web3(new Web3.providers.HttpProvider("https://rpc-mainnet.kcc.network"));
const metisWeb3 = new Web3(new Web3.providers.HttpProvider("https://www.andromeda.metis.io/?owner=1088"));

// -------------------------------------- Telegram --------------------------------------

const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.WEIGHT_CHANGES_BOT_TG_TOKEN);
const user_ids = CONFIG.WEIGHT_CHANGES_BOT.TG_USER_ID;
bot.start((ctx) => ctx.reply("Welcome."));
bot.launch();

//  ---------------------------------------- ABIs ----------------------------------------

const sushiEthereumABI = require("../abis/weight_changes/sushiEthereumABI.json");
const traderJoeABI = require("../abis/weight_changes/traderJoeABI.json");
const pangolinABI = require("../abis/weight_changes/pangolinABI.json");
const pancakeswapABI = require("../abis/weight_changes/pancakeswapABI.json");
const biswapABI = require("../abis/weight_changes/biswapABI.json");
const apeswapBscABI = require("../abis/weight_changes/apeswapBscABI.json");
const sushiPolygonABI = require("../abis/weight_changes/sushiPolygonABI.json");
const apeswapPolygonABI = require("../abis/weight_changes/apeswapPolygonABI.json");
const spookyswapABI = require("../abis/weight_changes/spookyswapABI.json");
const spiritswapABI = require("../abis/weight_changes/spiritswapABI.json");
const dfkABI = require("../abis/weight_changes/dfkABI.json");
const viperswapABI = require("../abis/weight_changes/viperswapABI.json");
const mmFinanceABI = require("../abis/weight_changes/mmFinanceABI.json");
const vvsFinanceABI = require("../abis/weight_changes/vvsFinanceABI.json");
const trisolarisABI = require("../abis/weight_changes/trisolarisABI.json");
const solarbeamABI = require("../abis/weight_changes/solarbeamABI.json");
const stellaswapABI = require("../abis/weight_changes/stellaswapABI.json");
const beamswapABI = require("../abis/weight_changes/beamswapABI.json");
const oolongswapABI = require("../abis/weight_changes/oolongswapABI.json");
const mojitoswapABI = require("../abis/weight_changes/mojitoswapABI.json");
const netswapABI = require("../abis/weight_changes/netswapABI.json");

//  --------------------------------------------------------------------------------------

const dexes = [
    //name, chain, address(mini/masterchef), ABI, additionalCall(if there is a separate method for getting rewarder and lpToken info), twitter handle

    //{ name: "Sushiswap(Ethereum)", chain: "ethereum", contract: "0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d",  abi: sushiEthereumABI, additionalCall: true, twittter: "SushiSwap" },
    { name: "Trader Joe", chain: "avalanche", contract: "0x188bED1968b795d5c9022F6a0bb5931Ac4c18F00", abi: traderJoeABI, additionalCall: false, twittter: "traderjoe_xyz" },
    { name: "Pangolin", chain: "avalanche", contract: "0x1f806f7C8dED893fd3caE279191ad7Aa3798E928", abi: pangolinABI, additionalCall: true, twittter: "pangolindex" },
    { name: "Pancakeswap", chain: "bsc", contract: "0x73feaa1eE314F8c655E354234017bE2193C9E24E", abi: pancakeswapABI, additionalCall: false, twittter: "PancakeSwap" },
    { name: "Biswap", chain: "bsc", contract: "0xDbc1A13490deeF9c3C12b44FE77b503c1B061739", abi: biswapABI, additionalCall: false, twittter: "biswap_dex" },
    { name: "Apeswap(BSC)", chain: "bsc", contract: "0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9", abi: apeswapBscABI, additionalCall: false, twittter: "ape_swap" },
    { name: "Sushiswap(Polygon)", chain: "polygon", contract: "0x0769fd68dFb93167989C6f7254cd0D766Fb2841F", abi: sushiPolygonABI, additionalCall: true, twittter: "SushiSwap" },
    { name: "Apeswap(Polygon)", chain: "polygon", contract: "0x54aff400858Dcac39797a81894D9920f16972D1D", abi: apeswapPolygonABI, additionalCall: false, twittter: "ape_swap" },
    { name: "Spookyswap", chain: "fantom", contract: "0x18b4f774fdC7BF685daeeF66c2990b1dDd9ea6aD", abi: spookyswapABI, additionalCall: true, twittter: "SpookySwap" },
    { name: "Spiritswap", chain: "fantom", contract: "0x9083EA3756BDE6Ee6f27a6e996806FBD37F6F093", abi: spiritswapABI, additionalCall: false, twittter: "spirit_swap" },
    { name: "Defi Kingdoms", chain: "harmony", contract: "0xDB30643c71aC9e2122cA0341ED77d09D5f99F924", abi: dfkABI, additionalCall: false, twittter: "DefiKingdoms" },
    { name: "Viperswap", chain: "harmony", contract: "0x7AbC67c8D4b248A38B0dc5756300630108Cb48b4", abi: viperswapABI, additionalCall: false, twittter: "VenomDAO" },
    { name: "Mad Meerkat Finance", chain: "cronos", contract: "0x6bE34986Fdd1A91e4634eb6b9F8017439b7b5EDc", abi: mmFinanceABI, additionalCall: false, twittter: "mmfcrypto" },
    { name: "VVS Finance", chain: "cronos", contract: "0xDccd6455AE04b03d785F12196B492b18129564bc", abi: vvsFinanceABI, additionalCall: false, twittter: "vvs_finance" },
    { name: "Trisolaris", chain: "aurora", contract: "0x3838956710bcc9D122Dd23863a0549ca8D5675D6", abi: trisolarisABI, additionalCall: true,  twittter: "trisolarislabs" },
    { name: "Solarbeam", chain: "moonriver", contract: "0xf03b75831397D4695a6b9dDdEEA0E578faa30907", abi: solarbeamABI, additionalCall: false, twittter: "solarbeamio" },
    { name: "Stellaswap", chain: "moonbeam", contract: "0xEDFB330F5FA216C9D2039B99C8cE9dA85Ea91c1E", abi: stellaswapABI, additionalCall: false, twittter: "stellaswap" },
    { name: "Beamswap", chain: "moonbeam", contract: "0xC6ca172FC8BDB803c5e12731109744fb0200587b", abi: beamswapABI, additionalCall: false, twittter: "beamswapio" },
    { name: "Oolongswap", chain: "boba", contract: "0x31B9FBd965397d697D2dAa434EbD219aB878E49B", abi: oolongswapABI, additionalCall: false, twittter: "oolongswap" },
    { name: "Mojitoswap", chain: "kcc", contract: "0x25C6d6A65C3ae5d41599Ba2211629B24604Fea4F", abi: mojitoswapABI, additionalCall: false, twittter: "mojitoswap" },
    //{ name: "Netswap", chain: "metis", contract: "0x9d1dbB49b2744A1555EDbF1708D64dC71B0CB052", abi: netswapABI, additionalCall: false, twittter: "netswapofficial" },
];

//  --------------------------------------------------------------------------------------

async function checkPools(pools, dex) { // compare pools to see if there is any change

    const knownPoolCount = Object.keys(pools).length;
    const currentPools = await getPools(dex);
    const currentPoolCount = Object.keys(currentPools).length;
    console.log(currentPoolCount);

    if (currentPoolCount > knownPoolCount) { //check if the pid count changes
        console.log(`There are ${currentPoolCount - knownPoolCount} new farm/s on ${dex.name}.`);
    }

    for (let pid = 0; pid < currentPoolCount; pid++) {
        if (pools[pid]) {
            if (currentPools[pid].allocPoint !== pools[pid].allocPoint) { // check if the farm weight has been changed. 
                console.log(`Alloc point for this pool changed: ${(currentPools[pid].lpToken).toLowerCase()}`);
                for (i in user_ids) {
                    bot.telegram.sendMessage(user_ids[i], `Alloc point for this farm changed on ${dex.name}: ${(currentPools[pid].lpToken).toLowerCase()} from ${pools[pid].allocPoint} to ${currentPools[pid].allocPoint}`);
                }
                return true;
            }

            if (currentPools[pid].rewarder !== pools[pid].rewarder) { // check if the pool's rewarder has been changed.
                console.log(`Rewarder for this pool changed: ${(currentPools[pid].lpToken).toLowerCase()}`);
                for (i in user_ids) {
                    bot.telegram.sendMessage(user_ids[i], `Rewarder for this farm changed on ${dex.name}: ${(currentPools[pid].lpToken).toLowerCase()} from ${pools[pid].rewarder} to ${currentPools[pid].rewarder}`);
                }
                return true;
            }
        } else { //there is a new pool
            pools[pid] = currentPools[i];
            for (i in user_ids) {
                bot.telegram.sendMessage(user_ids[i], `New farm found on ${dex.name} for this pool: ${(currentPools[pid].lpToken).toLowerCase()}. Analytics: https://dexscreener.com/${dex.chain}/${currentPools[pid].lpToken.toLowerCase()}`);
            }
            return true;
        }
    }

    return false;

}

async function getPools(dex) { // get pool data
    const pools = {}; // pools in a dex will be put in this list
    var contract = "";

    //check what chain the dex is on so that we know which RPC to use for the web 3 contract.
    if (String(dex.chain) == "ethereum") {
        contract = new ethereumWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "avalanche") {
        contract = new avalancheWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "bsc") {
        contract = new bscWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "fantom") {
        contract = new fantomWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "polygon") {
        contract = new polygonWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "harmony") {
        contract = new harmonyWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "cronos") {
        contract = new cronosWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "aurora") {
        contract = new auroraWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "moonriver") {
        contract = new moonriverWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "moonbeam") {
        contract = new moonbeamWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "boba") {
        contract = new bobaWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "kcc") {
        contract = new kccWeb3.eth.Contract(dex.abi, dex.contract);
    } else if (String(dex.chain) == "metis") {
        contract = new metisWeb3.eth.Contract(dex.abi, dex.contract);
    }

    const poolCount = parseInt(await contract.methods.poolLength().call()); // total pool count on the dex

     // check if there is a separate method for getting rewarder and lpToken info. if there is, call them to get the info.

    if (!dex.additionalCall) {
        for (let pid = 0; pid < poolCount; pid++) {
            pools[pid] = await contract.methods.poolInfo(pid).call();
        }
    } else {
        for (let pid = 0; pid < poolCount; pid++) {
            pools[pid] = await contract.methods.poolInfo(pid).call();
            pools[pid]["rewarder"] = await contract.methods.rewarder(pid).call();
            pools[pid]["lpToken"] = await contract.methods.lpToken(pid).call();
        }
    }

    return pools;
}

async function getAllPools() {
    var allPools = []; //an array of lists
    var pools = {}; // pools in a dex
    var contract = "";

    for (i in dexes) {
        //check what chain the dex is on so that we know which RPC to use for the web 3 contract.
        if (String(dexes[i].chain) == "ethereum") {
            contract = new ethereumWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "avalanche") {
            contract = new avalancheWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "bsc") {
            contract = new bscWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "fantom") {
            contract = new fantomWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "polygon") {
            contract = new polygonWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "harmony") {
            contract = new harmonyWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "cronos") {
            contract = new cronosWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "aurora") {
            contract = new auroraWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "moonriver") {
            contract = new moonriverWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "moonbeam") {
            contract = new moonbeamWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "boba") {
            contract = new bobaWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "kcc") {
            contract = new kccWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        } else if (String(dexes[i].chain) == "metis") {
            contract = new metisWeb3.eth.Contract(dexes[i].abi, dexes[i].contract);
        }
        const poolCount = parseInt(await contract.methods.poolLength().call()); // total pool count on the dex

        // check if there is a separate method for getting rewarder and lpToken info. if there is, call them to get the info.
        if (!dexes[i].additionalCall) {
            for (let pid = 0; pid < poolCount; pid++) {
                pools[pid] = await contract.methods.poolInfo(pid).call();
            }
        } else {
            for (let pid = 0; pid < poolCount; pid++) {
                pools[pid] = await contract.methods.poolInfo(pid).call();
                pools[pid]["rewarder"] = await contract.methods.rewarder(pid).call();
                pools[pid]["lpToken"] = await contract.methods.lpToken(pid).call();
            }
        }

        allPools.push(pools); // push the pool list(farms that the dex has)
        pools = {}; // clear the list
    }
    return allPools;
}

async function main() {
    var isChange = false;

    const allPools = await getAllPools(); // returns a list of list of pools for each dex, ordered the same as dexes

    while (!isChange) {
        for (let i = 0; i < dexes.length; i++) {
            isChange = await checkPools(allPools[i], dexes[i]); //returns true if there is a new change(weight, rewarder contract) on a pool or if there is a new farm on ith dex.
        }
    }
}

main();
