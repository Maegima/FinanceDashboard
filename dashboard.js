$(function () {
    datatable = $('#datatable').DataTable({
        scrollX: true,
    });
    result = $.get("http://localhost:5000/finances", (response) => {
        console.log(response);
        response.forEach((value) => {
            destination = value.destination ? value.destination.name : null;
            datatable.row.add([
                value.id, value.value, value.description, value.type.name,
                value.source.name, destination, value.referenceId, value.created
            ])
        });
        datatable.draw();
    })

    $('#datepicker').datepicker({
        format: 'dd/mm/yyyy',
    });

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

