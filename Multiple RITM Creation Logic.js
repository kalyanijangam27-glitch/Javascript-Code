(function execute(inputs, outputs) {

  var candidateName;

  var grName = new GlideRecord('sn_hr_core_on_boarding_core'); // take candidate name display value
  grName.addQuery('sys_id', inputs.script_candidatename);
  grName.query();
  if (grName.next()) {
    candidateName = grName.u_candidate_name;
  }

  var ritmSysId, optSysID;
  var array = [];
  var arrayName = [];

  var list = inputs.script_availableSoftware.toString(); // take application values 
  array = list.split(',');

  var catalogItem = gs.getProperty('software_application_catalog'); // catalog item sys_id

  for (var i = 1; i < array.length; i++) {
    var grRitm = new GlideRecord('sc_req_item');
    grRitm.initialize();
    grRitm.cat_item = catalogItem;
    grRitm.request = inputs.script_request.sys_id; // Input paramter came from flow
    grRitm.due_date = inputs.script_hiredate;
    grRitm.opened_by = inputs.script_opened_by.sys_id;
    grRitm.requested_for = inputs.script_opened_by.sys_id;

    // Set Business App Name value
    var grApp = new GlideRecord('cmdb_ci_business_app');
    grApp.addQuery('sys_id', array[i]);
    grApp.query();
    if (grApp.next()) {
      var app_name = grApp.name.split(',');
      arrayName.push(app_name);
      grRitm.short_description = candidateName + '-Software Application Access for ' + app_name;
    }

    ritmSysId = grRitm.insert(); // RITM Record Insert

    // Variable insertion logic of newly created RITM
    var itemName = grRitm.cat_item.name;
    var itemVar = new GlideRecord('item_option_new');
    var cat_query = itemVar.addQuery('cat_item.name', itemName);
    itemVar.query();
    var itemVarList = [];
    while (itemVar.next()) {
      itemVarList.push(itemVar.getUniqueValue('name'));
    }
    for (var j = 0; j < itemVarList.length; j++) {
      var itemOption = new GlideRecord('sc_item_option');
      itemOption.initialize();

      itemOption.order = j;
      itemOption.item_option_new = itemVarList[j];

      if (itemOption.item_option_new == gs.getProperty('candidate_name')) { // sys_id of candidate variable

        itemOption.value = inputs.script_candidatename.toString();
        itemOption.order = 1;
      }
      if (itemOption.item_option_new == gs.getProperty('manager_name')) { // sys_id of Manager variable

        itemOption.value = inputs.script_manager.toString();
        itemOption.order = 2;
      }

      if (itemOption.item_option_new == gs.getProperty('hire_date')) { // sys_id of Hire date variable

        itemOption.value = inputs.script_hiredate.toString();
        itemOption.order = 3;
      }

    }
    if (itemOption.item_option_new == gs.getProperty('candidate_application')) { // sys_id of available software variable

      itemOption.value = array[i];
      itemOption.order = 9;
    }

    optSysID = itemOption.insert();
    var ritmM2M = new GlideRecord('sc_item_option_mtom');
    ritmM2M.initialize();
    ritmM2M.request_item = ritmSysId; // Parent Item
    ritmM2M.sc_item_option = optSysID; // Dependent Values
    ritmM2M.insert();

  }

  // // Attach Flow on Remaining newly created requested item
  (function() {
    var ritmGR = new GlideRecord('sc_req_item');
    ritmGR.addQuery('sys_id', ritmSysId);
    ritmGR.query();
    while (ritmGR.next()) {
      try {
        var inputs = {};
        inputs['table_name'] = 'sc_req_item';
        inputs['request_item'] = ritmGR; // GlideRecord of table: sc_req_item

        var result = sn_fd.FlowAPI.getRunner().flow('sn_hr_core.multiple_software_application_checklist').inForeground().withInputs(inputs).run();
        var contextId = result.getContextId();
        grp.flow_context = contextId;
        grp.update();
      } catch(ex) {
        var message = ex.getMessage();
        gs.error(message);
      }
    }
  })();

  // Logic of existing RITM Need to update

  var ritmGRP = new GlideRecord('sc_req_item');
  ritmGRP.addQuery('sys_id', inputs.script_sysID); // Defaul RITM sys_id that create when we submit catalog item
  ritmGRP.query();
  if (ritmGRP.next()) {
    ritmGRP.variables.available_software = array[0];
    var grAppName = new GlideRecord('cmdb_ci_business_app');
    grAppName.addQuery('sys_id', array[0]);
    grAppName.query();
    if (grAppName.next()) {
      var business_app = [];
      business_app.push(grAppName.name);
      ritmGRP.short_description = candidateName + '- Software Application Access for ' + business_app;
    }

    ritmGRP.requested_for = inputs.script_manager;
    ritmGRP.due_date = inputs.script_opened_by.sys_id;
    ritmGRP.update();

    outputs.outputdata = array[0];
  }
})(inputs, outputs);
