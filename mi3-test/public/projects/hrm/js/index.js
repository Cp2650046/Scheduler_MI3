$(function(){
    // get permission
    USER_DATA.current_project_path = window.location.pathname
    main_get_user_permission();

    // render show_action_group
    var action_groups = ['Create', 'Update'];
    main_render_action_group(action_groups);
})



function click_btn_create(){
    //toastr.success('clicked create');

    main_set_loading({ loading: true, message: 'LOADING...NA'});

    $('body').on('loading.stop', function(event, loadingObj) {
     // do something whenever the loading state of #my-element is turned off
     
    });

    setTimeout(()=>{
        main_set_loading({ type: 'success', loading: false, message: 'xxxxx'});
    }, 1000)
}
function click_btn_update(){
    toastr.success('clicked update');
}
