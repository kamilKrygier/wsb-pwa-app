// Sprawdzamy, czy dokument został załadowany, abysmy mogli wykonać na nim operacje
jQuery(document).ready(function($){

    function populateTable() {
        $.ajax({
            url: '/get-records',
            method: 'GET',
            success: function (records) {
                const table = $('#pwa_table_income_and_costs')
                records.forEach(record => {
                    const typeLabel = record.type === 'income' ? 'Przychód' : 'Wydatek'
                    const row = `<tr data-id="${record._id}">
                        <td>${record.name}</td>
                        <td>${typeLabel}</td>
                        <td>${record.quantity}</td>
                        <td class='pwa_table_remove_row'>X</td>
                    </tr>`
                    table.append(row)
                })
            },
            error: function (error) {
                alert('Failed to load records.')
            },
        })
    }
    populateTable()

    $(document).on('submit', '#pwa_form_income_and_costs', function (e) {
        e.preventDefault()

        const pwa_input_name = $(this).find('input[name="pwa_input_name"]').val()
        const pwa_input_money_quantity = $(this).find('input[name="pwa_input_money_quantity"]').val()
        const pwa_input_type = $(this).find('select[name="pwa_input_type"]').val()

        const pwa_input_type_pl = pwa_input_type === 'income' ? 'Przychód' : 'Wydatek'

        $.ajax({
            url: '/add-record',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name: pwa_input_name,
                quantity: pwa_input_money_quantity,
                type: pwa_input_type,
            }),
            success: function (response) {
                
                const newRow = `<tr data-id="${response.id}">
                    <td>${pwa_input_name}</td>
                    <td>${pwa_input_type_pl}</td>
                    <td>${pwa_input_money_quantity}</td>
                    <td class='pwa_table_remove_row'>X</td>
                </tr>`
                $('#pwa_table_income_and_costs').append(newRow)
            },
            error: function (error) {
                console.error('Error saving record:', error)
                alert('Failed to save the record.')
            },
        })
    })
    
    $(document).on('click', '.pwa_table_remove_row', function () {
        const row = $(this).closest('tr')
        const recordId = row.data('id')

        $.ajax({
            url: `/delete-record/${recordId}`,
            method: 'DELETE',
            success: function () {
                row.remove()
            },
            error: function (error) {
                console.error('Error deleting record:', error)
                alert('Failed to delete the record.')
            },
        })
    })

    if (checkCookie('pwa_app_is_logged_in')) {
        console.log('User is logged in.')
        $('body').load("./pwa-app-form.html")
    } else {
        console.log('User is not logged in.')
        $('body').load("./pwa-app-login.html")
    }

    $(document).on('click', '#pwa_app_logout', function(){

        unsetCookie('pwa_app_is_logged_in')
        location.reload()

    })

    $(document).on('click', '.pwa_app_register_form_popup_close, .pwa_app_register_form_popup_overlay', function(){
        $(this).parent().stop().fadeOut(200)
    })

    $(document).on('click', '#pwa_app_register', function(){
        $('.pwa_app_register_form_popup_wrapper').stop().fadeIn(200)
    })   

})


function checkCookie(name) {
    const cookieArray = document.cookie.split('; ')
    for (let cookie of cookieArray) {
        const [cookieName, cookieValue] = cookie.split('=')
        if (cookieName === name) {
            return cookieValue === 'true'
        }
    }
    return false // Return false if the cookie is not found
}

function unsetCookie(name) {
    // Set the cookie with an empty value and an expiration date in the past
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
}

function esc_html(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;")
}