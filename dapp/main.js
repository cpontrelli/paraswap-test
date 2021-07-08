const web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");

const tokenTransferProxy = "0xDb28dc14E5Eb60559844F6f900d23Dce35FcaE33";

const erc20ABI = [{
    "constant": false,
    "inputs": [
        {
            "name": "_spender",
            "type": "address"
        },
        {
            "name": "_value",
            "type": "uint256"
        }
    ],
    "name": "approve",
    "outputs": [
        {
            "name": "",
            "type": "bool"
        }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}]

const ETH = {
        symbol: "ETH",
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        decimals: 18,
        img: "https://img.paraswap.network/ETH.png",
        network: 3
    }

const DAI = {
        symbol: "DAI",
        address: "0xaD6D458402F60fD3Bd25163575031ACDce07538D",
        decimals: 18,
        img: "https://img.paraswap.network/DAI.png",
        network: 3
    }

const amount = 100*10**18; // 1 DAI to exchange for ETH

$(document).ready(function() {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(async function(accounts) {
        $("#exchange_button").click(()=>{
            getPriceRoute(accounts[0]);
        });
    });
});

function getPriceRoute(account) {
    const priceUrl = `https://apiv4.paraswap.io/v2/prices?network=3&from=${DAI.address}&to=${ETH.address}&amount=${amount}&side=SELL`;

    $.ajax({
        url: priceUrl,
        type: "GET",
        headers: {
            'X-Partner':'LooneySwap'
        },
        success: function(result){
            exchange(account, result.priceRoute);
        },
        error: function(error){
            console.log('Error getting Price Route');
            console.log(error);
        }
    });
} 

async function exchange(account, priceRoute) {
    const exchangeUrl = `https://apiv4.paraswap.io/v2/transactions/3`;
    
    //calculate minimum amount of DAI to recieve after 10% slippage
    const destAmount = (priceRoute.destAmount*(90/100)).toFixed(0);
    
    const config = {
        priceRoute,
        srcToken: DAI.address,
        srcDecimals: DAI.decimals,
        destToken: ETH.address,
        destDecimals: ETH.decimals,
        srcAmount: amount.toFixed(0),
        destAmount,
        userAddress: account,
        referrer: 'LooneySwap',
        receiver: '0x0000000000000000000000000000000000000000'
    }

    let approved = await approveToken(config.srcToken, tokenTransferProxy, account, config.srcAmount)

    if (approved) {
        $.ajax({
            url: exchangeUrl,
            type: "POST",
            headers: {
                'X-Partner':'LooneySwap',
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(config),
            success: function(tx){
                web3.eth.sendTransaction(tx, (err) => {
                    console.log(err);
                });
            },
            error: function(error){
                console.log('Error getting transaction');
                console.log(error);
            }
        })
    } else {
        console.log('Allowance not approved')
    }
}

async function approveToken(tokenAddress, contractAddress, account, amount) {
    if (tokenAddress != "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
        contractInstance = new web3.eth.Contract(erc20ABI, tokenAddress, {from: account});
        return await contractInstance.methods.approve(contractAddress, amount).send();
    } else {
        return true;
    } 
}