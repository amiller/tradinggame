// Singleton game object
define(['js/microevent.js'], function () {
    var config = {
        rate_newitems: 0.01, // 100 seconds per item?
    };

    var items = [
        {img: 'img/cupcake.jpg', name: 'Cupcake', value: 2.0},
        {img: 'img/muffler.jpg', name: 'Muffler', value: 230.0},
        {img: 'img/textbook.jpg', name: 'Textbook', value: 100.0},
        {img: 'img/car.jpg', name: 'Car', value: 12000.0},
        {img: 'img/ps3.jpg', name: 'PS3', value: 500.0},
    ];

    var sellers = {
        'Joe': {id:'Joe', ratings:{pos: 10, neg:5}, priv:{defect_rate:0.6}},
        'Andrew': {id:'Andrew', ratings:{pos: 10, neg:5}, priv:{defect_rate:0.8}},
        'Zach': {id:'Zach', ratings:{pos: 10, neg:5}, priv:{defect_rate:0.0}},
    }

    function newAuctionWorld() {
        // Create a clone of an item with a unique key
        var item = Object.create(choice(items));
        item.id = randomString(20);
        var seller = choice(sellers);
        // fixme: add either A) a normal distribution here, 
        // or B) a sampling based on a buy/sell volume curve
        var price = item.value * (1+(Math.random()*2-1)*0.1);
        price = Math.round(price*100)/100;
        var auction = {
            id: randomString(20),
            item: item,
            price: price,
            seller: seller,
            timestamp: new Date().getTime(),
        }
        return auction;
    };

    function randomString(len, charSet) {
        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz,randomPoz+1);
        }
        return randomString;
    }
    
    Object.size = function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    function choice(objs) {
        if (objs.length != undefined)
            return objs[Math.floor(Math.random()*objs.length)];
        else {
            var idx = Math.floor(Math.random()*Object.size(objs));
            var i = 0;
            for (key in objs)
                if (i++ == idx)
                    return objs[key];
        }
    }
    
    // Game object
    function Game(){
        this.inventory = {};
        this.auctionsWorld = {};
        this.auctionsMine = {};
        this.timestamp = new Date().getTime();
        this.wallet = 1000.0;
        this.nyms = {
            'NymA': {id:'NymA', ratings:{pos: 1, neg:2}},
            'NymB': {id:'NymB', ratings:{pos: 1, neg:2}},
        }

        // Create some default logs
        logtriggers = ['InventoryItemAdded', 'AuctionAdded', 'ItemBought'];
        for (var i in logtriggers) {
            (function (game) {
                var s = logtriggers[i];
                game.bind(s, function (d) { console.info([s, d]) });
            })(this);
        }
    }

    // Call this to populate the buyable items with some initial things
    Game.prototype.populate = function () {
        var n_auctions = 10;
        for (var i = 0; i < n_auctions; i++) {
            var auction = newAuctionWorld();
            this.auctionsWorld[auction.id] = auction;
            this.trigger('AuctionAdded', auction);
        }
    }

    // Buy an item
    Game.prototype.buyItem = function (id) {
        if (!this.auctionsWorld.hasOwnProperty(id)) throw "No such auction";
        var auction = this.auctionsWorld[id];
        var item = auction.item;
        if (auction.price > this.wallet) throw "Not enough money";

        // FIXME add a delay so it doesn't immediately go to inventory, but simulates
        // the market
        this.inventory[item.id] = item;
        this.wallet -= auction.price;

        this.trigger('ItemBought', auction);
        this.trigger('InventoryItemAdded', item);
        this.trigger('WalletChanged', {'from':this.wallet+auction.price, 'to':this.wallet});
    }


    // Put an item up for sale
    Game.prototype.createAuction = function (id, price, nym) {
        if (!this.inventory.hasOwnProperty(id)) throw "Item not in inventory";
        var item = this.inventory[id];
        if (item.auctionid) throw "Item is already for sale";

        // FIXME use the nym from the arguments
        var nym = choice(this.nyms);
        var auction = {
            id: randomString(20),
            item: item,
            price: price,
            seller: nym,
            timestamp: new Date().getTime(),
        }
        // Add the auction
        this.auctionsMine[auction.id] = auction;
        item.auctionid = auction.id;
        this.trigger('AuctionAdded', auction);
    }

    Game.prototype.testA = function() {
        // Buy something
        this.buyItem(choice(this.auctionsWorld).id);
        // Sell it right away at 10% markup
        var item = choice(this.inventory);
        this.createAuction(item.id, item.value * 1.1);
    }

    MicroEvent.mixin(Game);
    var game = new Game();
    return game;
});