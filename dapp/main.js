const web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");

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

const amount = 10**17; // .1 ETH to exchange for DAI

$(document).ready(function() {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(async function(accounts) {
        $("#exchange_button").click(()=>{
            getPriceRoute(accounts[0]);
        });
    });
});

function getPriceRoute(account) {
    const priceUrl = `https://apiv4.paraswap.io/v2/prices?network=3&from=${ETH.address}&to=${DAI.address}&amount=${amount}&side=SELL`;

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

function exchange(account, priceRoute) {
    const exchangeUrl = `https://apiv4.paraswap.io/v2/transactions/3`;
    
    //calculate minimum amount of DAI to recieve after 10% slippage
    const destAmount = (priceRoute.destAmount*(90/100)).toFixed(0);
    
    const config = {
        priceRoute,
        srcToken: ETH.address,
        srcDecimals: ETH.decimals,
        destToken: DAI.address,
        destDecimals: DAI.decimals,
        srcAmount: amount.toFixed(0),
        destAmount,
        userAddress: account,
        referrer: 'LooneySwap',
        receiver: '0x0000000000000000000000000000000000000000'
    }

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

}