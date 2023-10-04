var apiScheduler = `${api_url}/masterplans`

async function getDataPlaning(type_id,search_date1,search_date2) {
    const url = `${apiScheduler}/get_data_plan`;
    let res = {}
    $.ajax({
        url: url,
        method: 'GET',
        data: { type_id,search_date1,search_date2 },
        async: false,
        dataType: 'JSON',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
            res = data;
        },
        error: function (err) {
            console.log(err);
        }
    })
    return res
}