function getTopLevelManager(userId) {
    var userGr = new GlideRecord('sys_user');  // Create GlideRecord object for sys_user table
    if (userGr.get(userId)) {  // Retrieve the user record by ID
        var currentUser = userGr;
        
        // Traverse up the manager chain
        while (currentUser.manager) {
            var managerGr = new GlideRecord('sys_user');
            if (managerGr.get(currentUser.manager)) {
                currentUser = managerGr;  // Move up the chain to the next manager
            } else {
                break;  // If manager record doesn't exist, exit loop
            }
        }
        
        // At this point, currentUser should be the top-level manager
        return currentUser;
    }
    return null;  // Return null if user is not found
}

// Call function of topManager
var topManager = getTopLevelManager('user_sys_id');  // Replace 'user_sys_id' with the actual user Sys ID
if (topManager) {
    gs.info('Top-level manager: ' + topManager.name);
} else {
    gs.info('User not found or no manager chain exists.');
}
