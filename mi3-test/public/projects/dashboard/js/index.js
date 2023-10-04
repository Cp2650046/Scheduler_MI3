$(async function(){
    await main_switch_project()
    
    var action_groups = ['Create', 'Update', 'Delete']
    main_render_action_group(action_groups)
})

function click_btn_create(){
    //toastr.success('clicked create');

    main_set_loading({ loading: true, message: 'LOADING...NA'})

    $('body').on('loading.stop', function(event, loadingObj) {
     // do something whenever the loading state of #my-element is turned off
     
    });

    setTimeout(()=>{
        main_set_loading({ type: 'success', loading: false, message: 'xxxxx'})
    }, 1000)
}

function click_btn_update(){
    toastr.success('clicked update')
}
