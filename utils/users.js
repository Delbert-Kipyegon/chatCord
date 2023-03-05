const users = [];

//add user to group
function userJoin(id, username, room){
    const user ={ id, username, room };
    users.push(user);
    return user;
}

// get user
function getCurrentUser(id){
    return users.find(user => user.id === id);
}

//user left 
function userLeave(id){
    const index = users.findIndex(user => user.id === id);

    if(index !== -1){
        return users.splice(index, 1)[0];
    }
}

// get group members
function getRoomUsers(room){

    return users.filter(user => user.room === room)
}


// remove user
function userRemove(id) {
    const index = users.findIndex(user => user.id === id);
  
    if (index !== -1) {
      const removedUser = users.splice(index, 1)[0];
      return removedUser;
    }
  }
  


module.exports = {
    userJoin,
    getCurrentUser,
    getRoomUsers,
    userLeave,
    userRemove
}