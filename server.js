const TelegramBot = require('node-telegram-bot-api')
const korbitapi = require('korbitapi')
const Korbit = new korbitapi() // public API only

const config = require('./config')

// polyfill
Number.isInteger = Number.isInteger || function(value) {
  return typeof value === "number" && 
         isFinite(value) && 
         Math.floor(value) === value
}

if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.token, { polling: true })

const korbitTicker = function (currency, chatID) {
  if(currency !== 'btc' && currency !== 'bch' && currency !== 'eth' && currency !== 'etc' && currency !== 'xrp' ) {
    console.warn('  : currency type is NOT correct! [ currency: ' + currency + ']')
    currency = 'btc'
  }
  Korbit.ticker(currency)
    .then(function (response) {
      bot.sendMessage(chatID, currency.toUpperCase() + ' now currenct: ' + response.data.last)
    })
    .catch(function (error) {
      console.log('[korbitTicker]', error);
    })
}

const korbitOrderbook = function (currency, chatID) {
  if(currency !== 'btc' && currency !== 'bch' && currency !== 'eth' && currency !== 'etc' && currency !== 'xrp' ) {
    console.warn('coinoneCurrentOrders: currency type is NOT correct! [ currency: ' + currency + ']')
    currency = 'btc'
  }
  Korbit.orderbook(currency)
  .then(function (response) {
    var recentCount = 10
    var getBuyerList = response.data.bids
    var getSellerList = response.data.asks
    var buyerList = getBuyerList.splice(0, recentCount)
    var sellerList = getSellerList.splice(0, recentCount)
    var sendMessageText = '--------------------[SELLER]\n'
    for (var i = sellerList.length - 1; i >= 0; i--) {
      sendMessageText += ( 'price: ' + sellerList[i][0] + ', qty: ' + sellerList[i][1] + '\n' )
    }
    sendMessageText += '--------------------[BUYER]\n'
    for (var i = 0; i < buyerList.length; i++) {
      sendMessageText += ( 'price: ' + buyerList[i][0] + ', qty: ' + buyerList[i][1] + '\n' )
    }

    // console.log(sendMessageText)
    bot.sendMessage(chatID, sendMessageText)
  })
  .catch(function (error) {
    console.log('[coinoneCurrentOrders]', error);
  })
}


const korbitTransction = function (currency, chatID) {
  if(currency !== 'btc' && currency !== 'bch' && currency !== 'eth' && currency !== 'etc' && currency !== 'xrp' ) {
    console.warn('  : currency type is NOT correct! [ currency: ' + currency + ']')
    currency = 'btc'
  }
  Korbit.orderbook(currency)
    .then(function (response) {
      var recentCount = 10
      var tradeList = response.data
      var recentTradeList = tradeList.splice(tradeList.length - recentCount, recentCount)
      var sendMessageText = ''
      for (var key in recentTradeList) {
        sendMessageText += ( 'price: ' + recentTradeList[key].price + ', qty: ' + recentTradeList[key].amount + '\n' )
      }
      bot.sendMessage(chatID, sendMessageText)
    })
    .catch(function (error) {
      console.log('[coinoneRecentCompletedOrders]', error);
    })
}

// system message
const sendHelpMessage = function (chatID) {
  var sendMessageText = '안녕하세요 코빗봇입니다. 명령어 설명드리겠습니다.\n\n'
                        + '/help : 현재 보고 계시는 명령어를 보실 수 있습니다.\n'
                        + '/btcnow : 비트코인의 현재가격을 보여줍니다.\n'
                        + '/bchnow : 비트코인캐시의 현재가격을 보여줍니다.\n'
                        + '/ethnow : 이더리움의 현재가격을 보여줍니다.\n'
                        + '/etcnow : 이더리움클래식의 현재가격을 보여줍니다.\n'
                        + '/xrpnow : 리플의 현재가격을 보여줍니다.\n'
                        + '/btctraded : 비트코인의 최근 거래내역 10개를 보여줍니다.\n'
                        + '/bchtraded : 비트코인캐시의 최근 거래내역 10개를 보여줍니다.\n'
                        + '/ethtraded : 이더리움의 최근 거래내역 10개를 보여줍니다.\n'
                        + '/etctraded : 이더리움클래식의 최근 거래내역 10개를 보여줍니다.\n'
                        + '/xrptraded : 리플의 최근 거래내역 10개를 보여줍니다.\n'
                        + '/btcorder : 비트코인의 현재 시장상황을 보여줍니다.\n'
                        + '/bchorder : 비트코인캐시의 현재 시장상황을 보여줍니다.\n'
                        + '/ethorder : 이더리움의 현재 시장상황을 보여줍니다.\n'
                        + '/etcorder : 이더리움클래식의 현재 시장상황을 보여줍니다.\n'
                        + '/xrporder : 리플의 현재 시장상황을 보여줍니다.\n'
                        + '\n이상입니다 채팅창에 "/" 표시를 누르시면 사용하기 편리하니 참고해주세요.'

  bot.sendMessage(chatID, sendMessageText, {
      reply_markup: {
        keyboard: [
          [{text: '/btcnow'}, {text: '/bchnow'}, {text: '/ethnow'}, {text: '/etcnow'}, {text: '/xrpnow'}],
          [{text: '/btctraded'}, {text: '/bchtraded'}, {text: '/ethtraded'}, {text: '/etctraded'}, {text: '/xrptraded'}],
          [{text: '/btcorder'}, {text: '/bchorder'}, {text: '/ethorder'}, {text: '/etcorder'}, {text: '/xrporder'}],
        ],
        resize_keyboard: true
      }
    })
}

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', function (msg) {
  try {
    var chatID = msg.chat.id
    var message = msg.text
    if (msg.document) {
      // message with file
    } else if (msg.photo) {
      // message with photo
    } else if (message) {
      // var name = msg.from.first_name
      // if (msg.from.last_name !== undefined){
      //   name = name + ' ' + msg.from.last_name
      // }

      if (/\/start/.test(message)) {
        sendHelpMessage(msg.chat.id)
      } else if (/\/help/.test(message)) {
        sendHelpMessage(msg.chat.id)
      } else if (/\/btcnow/.test(message)) {
        korbitTicker('btc', chatID)
      } else if (/\/bchnow/.test(message)) {
        korbitTicker('bch', chatID)
      } else if (/\/ethnow/.test(message)) {
        korbitTicker('eth', chatID)
      } else if (/\/etcnow/.test(message)) {
        korbitTicker('etc', chatID)
      } else if (/\/xrpnow/.test(message)) {
        korbitTicker('xrp', chatID)
      } else if (/\/btctraded/.test(message)) {
        korbitTransction('btc', chatID)
      } else if (/\/bchtraded/.test(message)) {
        korbitTransction('bch', chatID)
      } else if (/\/ethtraded/.test(message)) {
        korbitTransction('eth', chatID)
      } else if (/\/etctraded/.test(message)) {
        korbitTransction('etc', chatID)
      } else if (/\/xrptraded/.test(message)) {
        korbitTransction('xrp', chatID)
      } else if (/\/btcorder/.test(message)) {
        korbitOrderbook('btc', chatID)
      } else if (/\/bchorder/.test(message)) {
        korbitOrderbook('bch', chatID)
      } else if (/\/ethorder/.test(message)) {
        korbitOrderbook('eth', chatID)
      } else if (/\/etcorder/.test(message)) {
        korbitOrderbook('etc', chatID)
      } else if (/\/xrporder/.test(message)) {
        korbitOrderbook('xrp', chatID)
      }
    }
  } catch (error) {
    console.warn('[bot.on]', error)
  }
})
