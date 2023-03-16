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

const botName = 'Admin';

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
        const localBadWords = ['shit','motherfucker', 'wtf','bastard', 'shithead','cunt','bloody','nigga','negro'];
        const words = msg.toLowerCase().split(' ');
        const foundBadWords = words.filter((word) => localBadWords.includes(word));
      
        if (foundBadWords.length > 0) {
          return true;
        }
      
        const response = await axios.get(`https://www.purgomalum.com/service/containsprofanity?text=${msg}`);
        return response.data;
      }
    
        const MAX_BAD_WORDS = 3; // Maximum number of bad words allowed

const chatMessageHandler = (socket, io, botName) => {
  let userBadWords = 0; // Initialize bad word counter for the user

  socket.on('chatMessage', async (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));

    const isBadWord = await containsProfanityWords(msg);
    if (isBadWord) {
      userBadWords++;

      if (userBadWords >= MAX_BAD_WORDS) {
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

          socket.disconnect();
        }
      } else {
        io.to(user.room).emit(
          'message',
          formatMessage(botName, ` ${user.username}! Warning: Please refrain from using bad language. You have ${MAX_BAD_WORDS - userBadWords} warnings left.`)
        );
      }
    }
  });
};



chatMessageHandler(socket, io, botName);

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