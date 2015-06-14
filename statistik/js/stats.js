var waiting = false;
function refreshStats() {
	$.getJSON("http://couchdb.pajowu.de/neulandeuphonie/_design/api/_view/count_host_word_replacements?group_level=1", function(data){
		var table = $("table.wortUrl");
		table.empty();

		var tableHost = $("table.hostName");
		tableHost.empty();
		$.each(data.rows, function(index, entry){
	
			//split key into parts seperated at points
			var hn = entry.key[0].split('.').reverse();
			var hostname = hn[1] + "." + hn[0];

			//check if hostname is a ip
			if (!/[0-9]/.test(hn[0].charAt(0))) {
				entry.key[0] = hostname;
			}
		})

		//make new table with all same keys summarized
		var newObj = {};
		for(i in data.rows){
 			var item = data.rows[i];
    			if(newObj[item.key[0]] === undefined){
        			newObj[item.key[0]] = 0;
    			}
   			 newObj[item.key[0]] += item.value;
		}

		var result = {};
		result.rows = [];
		for(i in newObj){
   			result.rows.push({'key':i,'value':newObj[i]});
		}


		//sort table
		result.rows.sort(function(a,b){return b.value-a.value})

		//draw table
		var valueCount = 0;
		$.each(result.rows, function(index, entry){
			valueCount += entry.value
			var row = $("<tr><td>"+entry.key+"</td><td>"+entry.value+"</td></tr>");
			table.append(row);
		})

		var row = $("<tr><td></td><td><hr/></td></tr>		<tr><td>Gesamt</td><td>"+valueCount+"</td></tr>");
		table.append(row);
	})

	$.getJSON( "http://couchdb.pajowu.de/neulandeuphonie/_design/api/_view/count_word_replacements?group_level=1" , function(data){ 
		console.log(data);
		var table = $("table.wortAnzahl");
		table.empty();
		var valueCount = 0;
		data.rows.sort(function(a,b){return b.value-a.value})
		$.each(data.rows, function(index, entry){
			valueCount = valueCount + entry.value
			var row = $("<tr><td>"+entry.key+"</td><td>"+entry.value+"</td></tr>");
			table.append(row);
		})
		var row = $("<tr><td></td><td><hr/></td></tr>		<tr><td>Gesamt</td><td>"+valueCount+"</td></tr>");
		table.append(row);
	})
};
//check for browser support
if(typeof(EventSource)!=="undefined") {
	//create an object, passing it the name and location of the server side script
	var eSource = new EventSource("http://couchdb.pajowu.de/neulandeuphonie/_changes?filter=api/statistic&feed=eventsource");
	//detect message receipt
	eSource.onmessage = function(event) {
		//write the received data to the page
		console.log("got sse");
		if (!waiting) {
			waiting = true
			setInterval(function(){waiting=false;refreshStats()},1000);
		}
	};
}
else {
	document.getElementById("serverData").innerHTML="Whoops! Your browser doesn't receive server-sent events.";
}

refreshStats();
