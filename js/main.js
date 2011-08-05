/**
 * <Trading Game>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

require(["js/jquery-1.6.2.min.js", "game"], jQueryInit);

var game = null;

function isFloat(str)
{
  return !isNaN(new Number(str));
}

function showBuyTabItems(items)
{
    var vals = [];
    $.each(items, function (k,v) { vals.push(v); });
    $('#tab_buying').html($.tmpl('auctions_list', {items: vals}));
    $('#tab_buying table.auctions_list').css('height', $('#tab_buying table.auctions_list').height() + 'px');
    
    var buy_item = document.createElement('div');
    buy_item.id = 'buy_item';
    $('#tab_buying').prepend(buy_item);
    
    $('#tab_buying table.auctions_list td').click(function ()
    {
        var id = $(this).parent().find('a').attr('name');
        $('#buy_item').html($.tmpl('buy_item_page', { item: game.auctionsWorld[id] }));
        $('#buy_item').css('height', $('#buy_item').height() + 'px');
        
        // The buy handler
        $('#buy_item div.confirm').click(function ()
        {
          var id = $(this).parent().find('a[name]').attr('name');
          game.buyItem(id);
        });
        
        // Add the back link handler
        $('#buy_item a.back').click(function ()
        {
            $('#buy_item').hide('slide', { direction: 'up' }, function ()
            {
                $('#tab_buying table.auctions_list').show('slide', { direction: 'down' });
            });
        });
        
        // Hide the table and show the buy item page
        $('#tab_buying table.auctions_list').hide('slide', { direction: 'down' }, function ()
        {
            $('#buy_item').show('slide', { direction: 'up' });
        });
    });
}

function showInventoryTabItems(items)
{
    var vals = [];
    $.each(items, function (k,v) { vals.push(v); });
    $('#tab_inventory').html($.tmpl('tab_inventory', {items: vals}));
    
    $('#tab_inventory .item').click(function ()
    {
      var id = $(this).find('a[name]').attr('name');
      if ($('#create_auction a[name]').attr('name') != id)
      {
          $('#create_auction').remove();
          $.tmpl('create_auction_dialog', {
            item: game.inventory[id],
            boughtFor: game.boughtFor[id]
          }).appendTo('body');
      }
      
      var input = $('#create_auction input');
      function changeNet()
      {
          function delayed()
          {
              var amt = input.val();
              if (!isFloat(amt))
                  $(this).parent().find('span.netprofit').html('-');
              else
              {
                  var entered = parseFloat(input.val());
                  var delta = entered - game.boughtFor[id];
                  input.parent().find('span.netprofit').html(((delta < 0) ? '-' : '') + '$' +
                      Math.abs(delta).toFixed(2));
              }
          }
          
          setTimeout(delayed, 10);
      }
      
      $(document).keydown(changeNet);
      $('#create_auction input').change(changeNet);
      changeNet();
      
      $('#create_auction').dialog({
          modal: true,
          resizable: false,
          draggable: false,
          width: '500px',
          buttons: [
            {
                text: 'Create',
                click: function (evt)
                {
                    var input = $(this).find('input').val();
                    if (!isFloat(input))
                    {
                        $(this).parent().find('button').first().jConf({
                            sText: 'Please enter a valid price.',
                            okBtn: 'Okay',
                            evt: evt
                        });
                        return;
                    }
                    
                    var value = new Number(input);
                    game.createAuction(id, value, null);
                    $(this).dialog('close');
                    
                    addNotification('Created auction for <span class="item_display">' +
                        game.inventory[id].name + '</span> for <span class="money">$' +
                        value.toFixed(2) + '</span>.', 'tab_selling');
                }
              },
              {
                  text: 'Cancel',
                  click: function () {
                      $(this).dialog('close');
                      $(document).unbind('keydown', changeNet);
                  }
              }
          ]
      });
    });
}

function showSellTabItems(items)
{
    var vals = [];
    $.each(items, function (k,v) { vals.push(v); });
    $('#tab_selling').html($.tmpl('auctions_list', {items: vals}));
}

function updateWallet(amount)
{
  var wallet_amount = $('#wallet #wallet_amount');
  
  var floor = Math.floor(amount).toString();
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(floor))
      floor = floor.replace(rgx, '$1' + ',' + '$2');
  
  wallet_amount.html('$' + floor + '.<span class="decimal">' +
              (Math.floor(amount % 1 * 100)/100).toFixed(2).substring(2) + '</span>');
  
  var width = 0;
  $.each($('#wallet').children(), function (k,v) { width += $(v).width(); })
  
  if (width > $('#wallet').width())
      $('#wallet span.label').hide();
  else
      $('#wallet span.label').show();
  
  width = 0;
  $.each($('#wallet').children(), function (k,v) { width += $(v).width(); })
  
  if (width > $('#wallet').width())
  {
      // Add wrap hints (<wbr />) at every comma we add
      var wbrs = floor.split(',').join(',<wbr />');
      wallet_amount.html('$' + wbrs + '.<span class="decimal">' +
                  (Math.floor(amount % 1 * 100)/100).toFixed(2).substring(2) + '</span>');
  }
  
  $('#wallet').effect('highlight', {color: '#66DE00'}, 750);
}

/* `html` is the markup to put in the notification, and `tab` is the href minus
 * the pound sign of the tab to display if the player clicks on the notification
 */
function addNotification(html, tab)
{
    var elem = $(document.createElement('li'));
    
    elem.addClass('notification ui-corner-all');
    if ($('#tab_select li.notification').length == 0)
        elem.addClass('first');
    
    if (tab != undefined)
        elem.click(function ()
        {
            $('#tabs').tabs('select', tab);
        });
    
    elem.click(function ()
    {
      elem.slideUp(function () { elem.remove(); });
    });
    
    elem.html(html);
    elem.appendTo('#tab_select');
    elem.effect('highlight', {}, 1000);
    setTimeout(function ()
    {
        elem.slideUp(function () { $(this).remove(); });
    }, 5000);
}

function jQueryInit()
{
    game = require('game');
    game.populate();
    
    /*if (window.localStorage.game != undefined)
        game.load();*/
    
    require(["js/jquery-ui-1.8.14.min.js", "js/jquery.tmpl.min.js", "js/jConf-1.2.0.js"], function ()
    {
        $(function()
        {
            var tabs = $('#tabs').tabs().addClass('ui-tabs-vertical ui-helper-clearfix');
            $('#tabs li.ui-state-default').removeClass('ui-corner-top');
            $('#tabs li').click(function() {
                $('#tabs').tabs('select', ''+$(this).children().attr('href'));
            });
            
            // Update wallet display
            updateWallet(game.wallet);
            game.bind('WalletChanged', function (evt)
            {
              updateWallet(evt.to);
            });
            
            $.get('js/templates/auctions_list.htm', {}, function (data)
            {
                $.template('auctions_list', data);
                showSellTabItems(game.auctionsMine);
                
                $.get('js/templates/buy_item_page.htm', {}, function (data)
                {
                    $.template('buy_item_page', data);
                    showBuyTabItems(game.auctionsWorld);
                    
                    game.bind('AuctionAdded', function (item)
                    {
                        showBuyTabItems(game.auctionsWorld);
                        showSellTabItems(game.auctionsMine);
                    });
                    game.bind('ItemBought', function (auction)
                    {
                        showBuyTabItems(game.auctionsWorld);
                        $('#tab_buying a.back').click();
                        
                        addNotification('Bought <span class="item_display">' +
                            auction.item.name + '</span> for <span class="money">$' +
                            auction.price.toFixed(2) + '</span>.', 'tab_inventory');
                    });
                    game.bind('AuctionSold', function (auction)
                    {
                        showSellTabItems(game.auctionsMine);
                        
                        addNotification('Sold <span class="item_display">' +
                            auction.item.name + '</span> for <span class="money">$' +
                            auction.price.toFixed(2) + '</span>.');
                    });
                });
            });
            
            $.get('js/templates/tab_inventory.htm', {}, function (data)
            {
                $.template('tab_inventory', data);
                $.get('js/templates/create_auction_dialog.htm', {}, function (data)
                {
                    $.template('create_auction_dialog', data);
                    showInventoryTabItems(game.inventory);
                    
                    game.bind('InventoryItemAdded', function (item)
                    {
                      showInventoryTabItems(game.inventory);
                    });
                    game.bind('InventoryItemRemoved', function (item)
                    {
                      showInventoryTabItems(game.inventory);
                    });
                });
            });
        });
    });
    
    $(window).unload(function ()
    {
        game.save();
    });
}