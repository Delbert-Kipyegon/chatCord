const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser,getRoomUsers,userLeave, userRemove} = require('./utils/users');
const EventEmitter = require('events');
const axios = require('axios');
const { response } = require('express');

EventEmitter.setMaxListeners(20); 

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'chat bot';

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
    
    // check profanity 
   
   
    async function containsProfanityWords(msg) {
        const localBadWords = ['shit', 'puny', 'shite', 'shenzi','poko'];
        const words = msg.toLowerCase().split(' ');
        const foundBadWords = words.filter((word) => localBadWords.includes(word));
      
        if (foundBadWords.length > 0) {
          return true;
        }
      
        const response = await axios.get(`https://www.purgomalum.com/service/containsprofanity?text=${msg}`);
        return response.data;
      }
    

    // take chat from client
    socket.on('chatMessage', async (msg) =>{

        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));


        // console.log(containsProfanityWords(msg))

        // console.log(isBadWord);

        const isBadWord = await containsProfanityWords(msg);

        if (isBadWord) {

            console.log(response)
            const user = userLeave(socket.id);
      
            if (user) {
              io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username} was removed`)
              );
            
              io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room),
              });

               // Disconnect the socket after it has been removed
                 socket.disconnect();
            }
          }
        });

    
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