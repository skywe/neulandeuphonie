function sort(data) {
	//make all same keys summarized
	var diff = 0;
	if (/\[/.test(data.rows[0].key)) diff = 1;
	var newObj = [];
	for(i in data.rows){
		var item = data.rows[i];
		var item2;
		if (diff) item2 = item.key[0];
		else item2 = item.key;
		if(newObj[item2] === undefined) newObj[item2] = 0;
		newObj[item2] += item.value;
	}
	var result = {};
	result.rows = [];
	for(i in newObj) result.rows.push({'key':i,'value':newObj[i]});

	//sort
	result.rows.sort(function(a,b){return b.value-a.value});
	return [result, newObj];

}

function drawChart(struct, data) {
	//sort
	var newObj = sort(data)[1];

	//make new data for d3 chart
	var chart = {
		"name": "hostname",
		"children": [
	]};
	var nOfEntry = 0;
	var valueOfEntry = 0;
	for (i in newObj) {
		nOfEntry += 1;
		valueOfEntry += newObj[i];
	}
	var minInclude = valueOfEntry / nOfEntry * 0.5;
	for (i in newObj) {
		if (newObj[i] >= minInclude) chart.children.push({'name':i,'size':newObj[i]});
	}

	//draw chart
	var diameter = $(struct).width(),
	format = d3.format(",d"),
	color = d3.scale.category20c();

	var bubble = d3.layout.pack()
			.sort(null)
			.size([diameter,diameter])
			.padding(10);

	var svg = d3.select(struct).append("svg")
		.attr("width", diameter)
		.attr("height", diameter)
		.attr("class", "bubble");

	var node = svg.selectAll(".node")
		.data(bubble.nodes(classes(chart))
		.filter(function(d) { return !d.children; }))
		.enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	node.append("title")
		.text(function(d) { return d.className + ": " + format(d.value); });

	node.append("circle")
		.attr("r", function(d) { return d.r; })
		.style("fill", function(d) { return color(d.packageName); });

	node.append("text")
		.style("text-anchor", "middle")
		.text(function(d) { return d.className.substring(0, d.r / 3); });

	// Returns a flattened hierarchy containing all leaf nodes under the root.
	function classes(chart) {
		var classes = [];

		function recurse(name, node) {
			if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
			else classes.push({packageName: name, className: node.name, value: node.size});
		}

		recurse(null, chart);
		return {children: classes};
	}

	d3.select(self.frameElement).style("height", diameter + "px");
}

function drawTable(struct, data) {
	//sort
	var result = sort(data)[0];

	var table = $(struct);
	table.empty();
	var sum = 0;
	$.each(result.rows, function(index, entry){
		sum += entry.value;
		var row = $("<tr><td>"+entry.key+"</td><td>"+entry.value+"</td></tr>");
		table.append(row);
	})
	var row = $("<tr style='border-top: 0.063em solid #000;'><td>Gesamt</td><td>"+sum+"</td></tr>");
	table.append(row);
}

function stats(rw, sw) {
	//replaced_words
	if(rw) $.getJSON("http://couchdb.pajowu.de/neulandeuphonie/_design/api/_view/count_host_word_replacements?group_level=1", function(data){

		$.each(data.rows, function(_index, entry){
			//remove port
			var dp = entry.key[0].split(':').reverse();
			if (dp[1] === undefined) entry.key[0] = dp[0];
			else entry.key[0] = dp[1];
			//split at '.'
			var hn = entry.key[0].split('.').reverse();
			var hostname = hn[1] + "." + hn[0];
			//is an extended url
			var extendedDomain = 0;
			$.ajax({
				url: "../json/domains.json",
				async: false,
				dataType: 'json',
				success: function(extended) {
					$.each(extended.children, function(__index, extendedEntry) {
						for (i in extendedEntry) {
							if (hostname == extendedEntry[i]) extendedDomain = 1;
						}
					});
				}
			});
			//if not ip and not extendedDomain show only hostname
			if (!/[0-9]/.test(hn[0].charAt(0)) & !extendedDomain) entry.key[0] = hostname;
			// if extendedDomain also show part befor extended domain
			else if (extendedDomain) entry.key[0] = hn[2] + "." + hostname;
				//else isIp do nothing
		});

		drawTable(".replaced_words table", data);

		drawChart(".replaced_words div.content", data);

	});;

	//sum_words
	if(sw) $.getJSON( "http://couchdb.pajowu.de/neulandeuphonie/_design/api/_view/count_word_replacements?group_level=1" , function(data){ 

		drawTable(".sum_words table", data);

		drawChart(".sum_words div.content", data);

	});;

}
