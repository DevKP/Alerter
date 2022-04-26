var fetchIntervalNum;
var uiIntervalNum;
var alertsList;
var updating = false;

const apiUrl = 'https://alerter.online/api/Alerts/Active';

$(function(){
"use strict";
    moment.locale('uk');
    const uiUpdateTimeout = 1000;
    const apiFetchTimeout = 3000;

    // ------------TESTING-----------------
    // var item = createListItem('test', '🚨', 'Тестове повідомлення', 'тривалість');
    // item.prependTo('#alerts-list');
    // setTimeout(function(){ item.removeClass('collapsed') }, 5);

    // var item1 = createListItem('test1', '🚨', 'Тестове повідомлення Тестове повідомлення Тестове повідомлення ', 'тривалість');
    // item1.prependTo('#alerts-list');
    // setTimeout(function(){ item1.removeClass('collapsed') }, 5);
    // -------------------------------------

    $('#toggle-update-btn').on('click', function(){
        if(updating){
            stopUpdate();
            HideStatus();
        }else{
            ShowStatus();
            startUpdate(uiUpdateTimeout, apiFetchTimeout);
        }
    });

    $('#update-btn').on('click', async function(){
        updating = true;
        await updateAlerts();
        updateUI();
        updating = false;
    });

    $('#add-btn').on('click', function(){
        var item = createListItem('test', '🚨', 'Тестове повідомлення', 'тривалість');
        item.prependTo('#alerts-list');

        setTimeout(function(){ item.removeClass('collapsed') }, 5);
        updateUI();
    });

    $('#remove-btn').on('click', async function(){
        var $item = $('#alerts-list').children('.list-item:not(.collapsed):first').addClass('collapsed');
        setTimeout(function(){
            $item.remove();
        }, 500);
        updateUI();
    });

    $('#status').on('click', async function(){
        if(!$('.buttons').toggleClass('collapsed').hasClass('collapsed')){
            $('body').css("margin-top", "+=50");
        }else{
            $('body').css("margin-top", "-=50");
        }
    });

    ShowStatus();
    setInterval(updateUI, uiUpdateTimeout)
    updateAlerts();
    startUpdate(uiUpdateTimeout, apiFetchTimeout);
});

function createListItem(id, iconString, locationString, durationString){
    var elem = $('<li/>', {
        class: 'list-item collapsed',
        id: id});

    var icon = $('<span/>', {
        class: 'icon',
        text:  `${iconString} `
    });

    var location = $('<div/>', {
        class: 'location',//with-tooltip
    });

    var locationText = $('<p/>', {
        class: 'location-text',
        text: locationString
    });

    var duration = $('<span/>', {
        class: 'duration'//with-tooltip
    });

    var durationText = $('<span/>', {
        class: 'duration-text',
        text: durationString
    });

    var locationTooltip = $('<span/>', {
        class: 'tooltip-text',
        text: 'Область'
    });

    var durationTooltip = $('<span/>', {
        class: 'tooltip-text',
        text: 'Тривалість'
    });

    icon.appendTo(elem);
    location.append(locationText).appendTo(elem);//.append(locationTooltip)
    duration.append(durationText).appendTo(elem);//.append(durationTooltip)

    return elem;
}

function startUpdate(uiTimeout, apiTimeout){
    if(updating){
        console.info('Already updating');
        return;
    }

    fetchIntervalNum = setInterval(updateAlerts, apiTimeout);

    updating = true;
}

function stopUpdate(){
    if(!updating){
        console.info('Already not updating');
        return;
    }

    clearInterval(fetchIntervalNum);

    updating = false;
}

async function updateAlerts(){
    console.info("Fetching alerts");
    alertsList = await getAlertList();
}

async function getAlertList()
{
    try {
        const response = await fetch(apiUrl);
        if(!response.ok){
            ErrorStatus(response.status + ' ' + response.statusText);
            return;
        }

        Status('sync');
    
        const responseJson = await response.json();
        return responseJson.alerts.sort((a,b) => moment(a.started_at) - moment(b.started_at));
    } catch (error) {
        ErrorStatus(error);
        console.info(error);
    }
}

function updateUI(){  
    var $list = $('.list');  

    $list.children('li:not(.collapsed)li:not(.empty-placeholder)').toArray().forEach(el => {
        if(updating && !alertsList.some(alert => alert.id == el.id) && alertsList.length != 0){
            setTimeout(function(){
                el.classList.add("collapsed");
            }, 100);
            
            setTimeout(function(){
                el.remove();
            }, 1000);
        }
    });

    alertsList.forEach(alert => {
        var alert = ParseJson(alert);
        var $item = $list.children(`#${alert.id}:not(.collapsed)`);
        // var startDate = moment.now() - moment(alert.started_at);
        var start = moment(alert.started_at).calendar();
        var startFromNow = moment(alert.started_at).fromNow();
        // var humanizedDuration = humanizeDuration(startDate, { language: "uk", largest: 2, units: ['d', 'h', 'm', 's'], round: true});       
        if($item[0]){
            $item.find('.duration-text').text(`${start} (${startFromNow})`);
        }
        else if(updating){
            var item = createListItem(alert.id, '🚨', alert.location_title, `${start} (${startFromNow})`);
            $list.prepend(item);
            setTimeout(function(){
                item.removeClass('collapsed');
            }, 50);
        }
    });

    if(alertsList.some(alert => alert.location_title.includes("ранків"))){
        console.info('запор');
        $('.header-box h1').text('Катя в небезпеці!™');
        //Франківськ підвал
    }
    else{
        $('.header-box h1').text('Alerter™');
    }

    if($list.children('li').length == 0)
    {
        $list.append('<li class="empty-placeholder collapsed"><p>Все спокійно <span>🎉</span></p></li>');
        setTimeout(function(){
            $list.children(`.empty-placeholder`).removeClass('collapsed');
        }, 50);
    }
    else if($list.children('li:not(.empty-placeholder)').length != 0){
        setTimeout(function(){
            $list.children(`.empty-placeholder`).addClass("collapsed");
        }, 50);
        
        setTimeout(function(){
            $list.children(`.empty-placeholder`).remove();
        }, 1000);
    }
} 

function ErrorStatus(text){
    return $('#status')
            .text(text)
            .addClass('sync-error');
}

function Status(text){
    return $('#status')
            .text(text)
            .removeClass('sync-error');
}

function HideStatus(){
   return $('#status').addClass('hidden');
}

function ShowStatus(){
    return $('#status').removeClass('hidden');
}

function ParseJson(json){
    return { 
        active: json["active"],
        duration: json["duration"],
        ended_at: json["ended_at"],
        id: json["id"],
        location_title: json["location_title"],
        started_at: json["started_at"]
    };
}