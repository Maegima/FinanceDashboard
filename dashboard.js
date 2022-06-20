var selected_col;
var col_data;
var col_disp;

function newInput(value){
    var element;
    if(value != undefined)
        element = `<input type=text value="${value}">`;
    else
        element = "<input type=text>";
    
    return element;
}

$(function () {
    datatable = $('#datatable').DataTable({
        scrollX: true,
        order: [[0, 'desc']],
        autoWidth: false
    });

    $.ajaxSetup({
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    result = $.get("http://localhost:5000/finances", (response) => {
        console.log(response);
        var referenceSelect = $("#finance-form").find("select[name=reference]");
        const paramList = ["id", "value", "description", "type", "source", "destination", "referenceId", "datetime"]
        response.forEach((value) => {
            value.destination = value.destination ? value.destination.name : null;
            value.type = value.type.name;
            value.source = value.source.name;

            datatable.row.add(paramList.map((key) => {
                return value[key];
            }));
        });

        response.reverse().forEach((value) => {
            referenceSelect.append(`<option value=${value.id}>${value.id} - ${value.description}</option>`)
        });

        datatable.draw();
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
                    destination = value.destination ? value.destination.name : null;
                    datatable.row.add([
                        value.id, value.value, value.description, value.type.name,
                        value.source.name, destination, value.referenceId, value.datetime
                    ])
                    datatable.draw();

                    var referenceSelect = $("#finance-form").find("select[name=reference]");
                    var option = $(referenceSelect).find("option")[0];
                    $(option).after(`<option value=${value.id}>${value.id} - ${value.description}</option>`)
                })
            }
        })
    })

    function empty(value){
        return value == "" || value == null || value == undefined;
    }

    function compareData(current, old){
        list = [];
        for(var i = 0; i < current.length; i++){
            //console.log(index, nodeList[index]);
            if(old[i] == current[i])
                return false;
        }
        return true;
    }

    // $('#finance-body').on("click", "tr", function() {
    //     var nodeList;
    //     if(selected_row != undefined && this != selected_row){
    //         current_data = [];
    //         nodeList = selected_row.childNodes;
    //         for(var [ index, value ] of nodeList.entries()) {
    //             if(nodeList[index].children.length > 0){
    //                 var item;
    //                 nodeList[index].innerHTML = item = nodeList[index].children[0].value;
    //                 if(typeof row_data[index] == "number"){
    //                     item = parseFloat(item);
    //                 }
    //                 current_data.push(empty(item) ? row_data[index] : item);
    //             }
    //         }
    //         //console.log(current_data);
    //         datatable.row(selected_row).data(current_data);
    //     }
        
    //     _mirror = $('#autosize');
    //     if(this != selected_row){
    //         nodeList = this.childNodes;
    //         for(var [ index, value ] of nodeList.entries()) {
    //             value = nodeList[index].innerHTML;
    //             nodeList[index].innerHTML = `<input value="${value}" />`;
    //             _mirror.text(value);
    //             _input = $(nodeList[index].childNodes[0]);
    //             //_input.width( _mirror.width());
    //         }
    //         datatable.columns.adjust().draw();
    //         selected_row = this;
    //         row_data = datatable.row(this).data();
    //     }
    // })
    $('#finance-body').on("click", "td", function() {
        //console.log(datatable.cell(this).column().header().innerHTML);
        //console.log(datatable.row(this).node());
        //console.log(this);
        if(this != selected_col){
            var node;
            if(selected_col != undefined){
                var data = datatable.cell(selected_col).data();
                node = datatable.cell(selected_col).node();
                node.innerHTML = data;
            }
            var cell = datatable.cell(this);
            node = datatable.cell(this).node();
            node.innerHTML = `<input value="${node.innerHTML}" />`;
            const input = node.children[0];
            input.focus();
            const end = input.value.length;
            input.setSelectionRange(end, end);
            selected_col = this;
            col_disp = datatable.cell(this).data();

            $(input).on("keyup", function(e){
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
            })
        }
    }) 

    $('#finance-body').on("focusout", "td", function() {
        if(this == selected_col){
            var cell = datatable.cell(selected_col);
            if(col_disp != cell.data()){
                var row = datatable.row(selected_col);
                var col = cell.index().column;
                id = row.data()[0];
                var display = col_disp;
                key = cell.column(col).header().innerHTML.toLowerCase();
                data = `{"${key}": ${col_data}}`;
                $.ajax({
                    url: `http://localhost:5000/finance/${id}`,
                    data: data,
                    type: "PUT",
                    dataType: "json" 
                }).done((response) =>{
                    cell.data(display);
                }).fail((xhr, textStatus, errorThrown) => {
                    datatable.draw();
                    alert(xhr.responseText);
                })
            }
            else{
                cell.node().innerHTML = col_disp;
            }
            col_disp = undefined;
            col_data = undefined;
            selected_col = undefined;
        }
    })

    feather.replace({ 'aria-hidden': 'true' })

    setTimeout(test, 1)
})

async function test() {
    // Graphs
    const ctx = document.getElementById('myChart')
    // eslint-disable-next-line no-unused-vars
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [
                'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
            ],
            datasets: [{
                data: [
                    15339, 21345, 18483, 24003, 23489, 24092, 12034
                ],
                lineTension: 0,
                backgroundColor: 'transparent',
                borderColor: '#007bff',
                borderWidth: 4,
                pointBackgroundColor: '#007bff'
            }]
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

