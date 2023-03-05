const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser,getRoomUsers,userLeave, userRemove} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'chat bot'

//client connection pass data
io.on('connection', socket =>{

    socket.on('joinRoom', ({ username, room}) =>{
    const user = userJoin(socket.id, username, room)
    socket.join(user.room);

    //broadcast(tell every user) on user conn
    socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} joined`));

        // users + rooms 
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    });

    

    socket.emit('message', formatMessage(botName,'Welcome to the group'));

    
    

    // take chat from client
    socket.on('chatMessage', (msg) =>{

        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));

        // check profanity 
        const badWords = [ 'shit', 'puny', 'shite'];

        function checkProfanity(msg) {
            const words = msg.toLowerCase().split(' ');
            const foundBadWords = words.filter(word => badWords.includes(word));
            return foundBadWords.length > 0;
          }
        
        const isBadWord = checkProfanity(msg);  

        if (isBadWord){
            // userLeave(socket.id);
             // Assuming your socket.io server instance is stored in a variable called `io`
            //  let removedUserDeets = userRemove(socket.id);
            //  console.log(removedUserDeets);
            //  io.to(removedUserDeets.room).emit(`${removedUserDeets.username} was removed`, removedUserDeets.username);
            //  io.sockets.connected[removedUserDeets.id].leave(removedUserDeets.room);
            
        }

        console.log(msg);


    })

    //user left
    socket.on('disconnect', () =>{

        const user = userLeave(socket.id);

        if(user){
        io.to(user.room).emit('message',formatMessage(botName, `${user.username} left the group`));
       
        // users + rooms 
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    }

        

    });

});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));