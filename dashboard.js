$(function () {
    datatable = $('#datatable').DataTable({
        scrollX: true,
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
        response.forEach((value) => {
            destination = value.destination ? value.destination.name : null;
            datatable.row.add([
                value.id, value.value, value.description, value.type.name,
                value.source.name, destination, value.referenceId, value.datetime
            ])
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
            console.log(response);
        })
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

