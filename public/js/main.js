const socket = io();
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const leaveChatbtn = document.getElementById('leave-btn')

// username and group from url 
const {username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});


// join group 
socket.emit('joinRoom', { username, room});

// get room and users

socket.on('roomUsers', ({ room, users}) =>{
    outputRoomName(room);
    outputRoomUsers(users);
})


//receive data from server
socket.on('message', message =>{
    outputMessage(message);

    // auto scroll 
    chatMessages.scrollTop = chatMessages.scrollHeight;
});


// redirect to index page upon disconnection
socket.on('disconnect', () => {
    window.location.href = 'index.html';
  });

chatForm.addEventListener('submit', (e) =>{
    e.preventDefault();

    const msg = e.target.elements.msg.value;

    //send msg to server
    socket.emit('chatMessage', msg);

    //clear input field
    e.target.elements.msg.value ='';
    e.target.elements.msg.focus();

});




// TO DOM 
//send message 

function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta"> <span>${message.username}</span> ${message.time} </p>
    <p class="text">
    ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

// Add room

function outputRoomName(room){
    roomName.innerText = room;

}

// Add users
function outputRoomUsers(users){
    userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
    
}


//Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
    const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
    if (leaveRoom) {
      window.location = '../index.html';
    } else {
    }
  });