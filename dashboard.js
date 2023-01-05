var selected_col;
var col_data;
var col_disp;
var dataValues = [];
var myChart = null;

function setAttribute(element, attrs, attribute){
    if(attrs[attribute] !== undefined){
        element[attribute] = attrs[attribute];
        delete attrs[attribute];
    }
}

function groupByMonthAndAsset(data){
    group = { 
        active: {
            color: '#007bff',
            label: "active",
            months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }, 
        passive: {
            color: '#ff007b',
            label: "passive",
            months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }, 
        neutral: {
            color: '#C0C0C0',
            label: "neutral",
            months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        delayed: {
            color: '#ff7b00',
            label: "delayed",
            months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    };
    valor = 0;
    data.each((item) => {
        month = parseInt(item.datetime.substring(5, 7));
        asset = item.type.asset != null ? item.type.asset : "neutral";
        asset = item.type.name != "DELAYED" ? asset : "delayed";
        
        group[asset].months[month-1] += item.value;
    })
    group.active

    return group;
}

function groupByType(data){

}

function createElement(tagName, attrs = {}){
    element = document.createElement(tagName);
    setAttribute(element, attrs, "text");
    Object.keys(attrs).forEach(function(key){
        element.setAttribute(key, attrs[key]);
    })
    
    return element;
}

function lowerFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

function empty(value){
    return value == "" || value == null || value == undefined;
}

$(function () {
    datatable = $('#datatable').DataTable({
        scrollX: true,
        order: [[0, 'desc']],
        autoWidth: false,
        columns: [
            { "data": "id" },
            { "data": "value" },
            { "data": "description" },
            { "data": "typeName" },
            { "data": "source" },
            { "data": "destination" },
            { "data": "referenceId" },
            { "data": "datetime" }
        ]
    });

    datatable.on('draw.dt', function(){
        setTimeout(test, 1, datatable.rows({search: "applied"}).data());
    })

    $.ajaxSetup({
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    result = $.get("http://localhost:5000/finances", (response) => {
        var referenceSelect = $("#finance-form").find("select[name=reference]");
        response.forEach((value) => {
            value.destination = value.destination ? value.destination.name : null;
            value.typeName = value.type.name;
            value.source = value.source.name;
        });

        response.reverse().forEach((value) => {
            referenceSelect.append(`<option value=${value.id}>${value.id} - ${value.description}</option>`)
        });

        datatable.rows.add(response).draw();
    })

    result = $.get("http://localhost:5000/finance/types", (response) => {
        console.log(response);
        var typeSelect = $("#finance-form").find("select[name=type]");
        response.forEach((value) => {
            typeSelect.append(`<option value=${value.id}>${value.name}</option>`)
        });
        datatable.draw();
    })

    result = $.get("http://localhost:5000/accounts", (response) => {
        console.log(response);
        var sourceSelect = $("#finance-form").find("select[name=source]");
        var destinationSelect = $("#finance-form").find("select[name=destination]");
        response.forEach((value) => {
            sourceSelect.append(`<option value=${value.id}>${value.name}</option>`)
            destinationSelect.append(`<option value=${value.id}>${value.name}</option>`)
        });
        datatable.draw();
    })

    $('#datepicker').datepicker({
        format: 'yyyy-mm-dd',
    });

    $('#new-finance').on("click", function(){
        var inputs = $("#finance-form").find("input");
        var selects = $("#finance-form").find("select");
        var financeObj = {};
        inputs.each((index, input) => {
            if(input.value != ""){
                financeObj[input.name] = input.value;
            }
        })
        
        selects.each((index, input) => {
            if(input.value != ""){
                financeObj[input.name] = { id: input.value };
            }
        })
        financeObj.datetime = new Date(financeObj.datetime).toISOString();

        result = $.post("http://localhost:5000/finance", JSON.stringify(financeObj), (response) => {    
            if(response.length > 0){
                response[0].id;
                result2 = $.get(`http://localhost:5000/finance/${response[0].id}`, (response) => {
                    value = response;
                    console.log(value);
                    value.destination = value.destination ? value.destination.name : null;
                    value.typeName = value.type.name;
                    value.source = value.source.name;
                    datatable.row.add(value);
                    datatable.draw();

                    var referenceSelect = $("#finance-form").find("select[name=reference]");
                    var option = $(referenceSelect).find("option")[0];
                    $(option).after(`<option value=${value.id}>${value.id} - ${value.description}</option>`)
                })
            }
        })
    })

    function buildSelect(select, selected = undefined){
        return function(){
            if(this.innerHTML == selected)
                select.append(createElement("option", {value: this.value, text: this.innerHTML, selected: "selected"}))
            else
                select.append(createElement("option", {value: this.value, text: this.innerHTML}))
        }
    }

    function changeField(cell){
        var columnId = cell.index().column;
        var column = lowerFirstLetter(cell.column(columnId).header().innerHTML);
        var node = cell.node();
        
        switch(column){
            case "type":
            case "source":
            case "destination":
                var select = $("#finance-form").find(`select[name=${column}]`);
                var input = createElement("select");
                select.children().each(buildSelect(input, cell.data()));
                node.innerHTML = input.outerHTML;
                var input = node.children[0];

                $(input).on("change", changeUpdate);
                break;
            default:
                var input = createElement("input", {value: node.innerHTML});
                const end = input.value.length;
                input.setSelectionRange(end, end);
                node.innerHTML = input.outerHTML;
                var input = node.children[0];

                $(input).on("keyup", keyupUpdate);
                break;
        }
        
        input.focus();
    }

    function changeUpdate(){
        if(empty(this.value)){
            col_data = "null";
            col_disp = null;
        }
        else if(!isNaN(this.value)){
            col_data = parseFloat(this.value);
            col_disp = this.options[this.selectedIndex].text;
        }
        else{
            col_data = `"${this.value}"`;
            col_disp = this.options[this.selectedIndex].text;
        }
        this.blur();
    }

    function keyupUpdate(e){
        if(e.key == "Enter"){
            if(empty(this.value)){
                col_data = "null";
                col_disp = null;
            }
            else if(!isNaN(this.value)){
                col_data = parseFloat(this.value);
                col_disp = parseFloat(this.value);
            }
            else{
                col_data = `"${this.value}"`;
                col_disp = this.value
            }
            this.blur();
        }
    }

    $('#finance-body').on("click", "td", function() {
        if(this != selected_col){
            var node;
            if(selected_col != undefined){
                var data = datatable.cell(selected_col).data();
                node = datatable.cell(selected_col).node();
                node.innerHTML = data;
            }
            var cell = datatable.cell(this);
            changeField(cell);
            selected_col = this;
            col_disp = cell.data();
        }
    })

    $('#finance-body').on("focusout", "td", function() {
        if(this == selected_col){
            var cell = datatable.cell(selected_col);
            if(col_disp != cell.data() && col_data !== undefined && col_disp !== undefined){
                var row = datatable.row(selected_col);
                var col = cell.index().column;
                id = row.data()["id"];
                key = lowerFirstLetter(cell.column(col).header().innerHTML);
                data = `{"${key}": ${col_data}}`;
                $.ajax({
                    url: `http://localhost:5000/finance/${id}`,
                    data: data,
                    type: "PUT",
                    dataType: "json" 
                }).done((response) =>{
                    cell.data(col_disp);
                }).fail((xhr, textStatus, errorThrown) => {
                    cell.node().innerHTML = cell.data();
                    datatable.draw();
                    alert(xhr.responseText);
                }).always(() => {
                    col_disp = undefined;
                    col_data = undefined;
                    selected_col = undefined;
                })
            }
            else{
                var data = datatable.cell(selected_col).data();
                var node = datatable.cell(selected_col).node();
                node.innerHTML = data;
                selected_col = undefined;
            }
        }
    })

    feather.replace({ 'aria-hidden': 'true' })
})

function toDataSet(asset){
    return {
        data: asset.months,
        lineTension: 0,
        backgroundColor: 'transparent',
        borderColor: asset.color,
        borderWidth: 4,
        pointBackgroundColor: asset.color,
        label: asset.label
    }
}

async function test(data) {
    // Graphs
    console.log(data);
    dataValues = groupByMonthAndAsset(data)
    const ctx = document.getElementById('myChart')
    // eslint-disable-next-line no-unused-vars
    if(myChart != null){
        myChart.destroy();
    }
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
            datasets: [toDataSet(dataValues.active), toDataSet(dataValues.passive), toDataSet(dataValues.neutral), toDataSet(dataValues.delayed)]
        },
        options: {
            scales: {},
            legend: {
                display: false
            }
        }
    })
    //await sleep(1);
}

