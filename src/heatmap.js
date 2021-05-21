class Heatmap {
    static async get_data(transport_data, stops_data) {
        var setting = Views.get_haul_diagram_setting();
        var data = [];

        for (var i = 0; i < transport_data.length; i++) {
            var route_info = transport_data[i];
            var route_number = route_info['ROUTE_NUMBER'];
            var route_variant = route_info['ROUTE_VARIANT'];
            var route_data = await loading_data.load_data_for_heatmap(route_number,
                route_variant, 
                stops_data,
                setting);
            
            data.push({
                route_number: route_number,
                route_variant: route_variant,
                route_data: route_data
            });
        }

        return data;
    }

    static async build(transport_data, stops_data, type) {
        var data = await Heatmap.get_data(transport_data, stops_data);
        var element_div = type == 'haul' ? '#heatmap_haul' : '#heatmap_stop';

        Views.clear_heatmap();

        var margin = {top: 30, right: 5, bottom: 50, left: 90};
        var width = 830 - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;

        var svg = d3.select(element_div)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

        var myGroups = [];
        var myVars = [];

        data.forEach(element => {
            myVars.push(`${element.route_number} (${element.route_variant})`);
        });

        var time = 5;
        var end_time = 1;
        while (time % 24 != end_time - 1) {
            myGroups.push(`${time}:00`);
            time++;
        }

        var data_real = [];
        for (var i = 0; i < myVars.length; i++) {
            for (var j = 0; j < myGroups.length; j++) {
                data_real.push({
                    group: `${myGroups[j]}`,
                    variable: `${myVars[i]}`,
                    value: `${data[i].route_data[j].value}`
                });
            }
        }

        var sorted = [];
        function compare(a, b) {
            if (a < b) {
              return -1;
            }
            if (a > b) {
              return 1;
            }
            return 0;
        }
        data.forEach(element => {
            element.route_data.forEach(v => {
                sorted.push(v.value);
            });
        });
        sorted = sorted.sort(compare).filter(value => value != 0);
        var domain = sorted[Math.trunc(sorted.length * 0.9)];

        // Build X scales and axis:
        var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(myGroups)
        .padding(0.01);
        svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

        // Build X scales and axis:
        var y = d3.scaleBand()
        .range([ height, 0 ])
        .domain(myVars)
        .padding(0.01);
        svg.append("g")
        .call(d3.axisLeft(y));

        var colors = Views.get_haul_diagram_setting().characteristic == 0 ? ["orange", "white"]
            : ["white", "orange"];

        // Build color scale
        var myColor = d3.scaleLinear()
        .range(colors)
        .domain([0,domain]);

        // create a tooltip
        var tooltip = d3.select("#heatmap_haul")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        // Three function that change the tooltip when user hover / move / leave a cell
        var mouseover = function(d) {
            tooltip.style("opacity", 1)
        }
        var mousemove = function(d) {
            tooltip
            .html(d.value)
            .style("left", (d3.mouse(this)[0]+70) + "px")
            .style("top", (d3.mouse(this)[1]) + "px")
        }
        var mouseleave = function(d) {
            tooltip.style("opacity", 0)
        }

        // add the squares
        svg.selectAll()
            .data(data_real, function(d) {return d.group+':'+d.variable;})
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(d.group) })
            .attr("y", function(d) { return y(d.variable) })
            .attr("width", x.bandwidth() )
            .attr("height", y.bandwidth() )
            .style("fill", function(d) { return myColor(d.value)} )
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
    }
}