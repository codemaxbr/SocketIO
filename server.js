const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ['*']
    }
})

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const Redis = require('ioredis')
const users = []
const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_HOST)
//const ioredis = require('socket.io-emitter')(redis)

//-------------------------------------------------------------------
//  Interação do Redis com o Socket.io
//-------------------------------------------------------------------
redis.subscribe(['public', 'private'])

redis.on('message', (ch, message) => {
    const {user, account_id, event, payload} = JSON.parse(message)
    const room = `account_${account_id}`
    console.log('on redis', {event}, {payload}, {account_id})

    if (ch === 'public') {
        io.to(room).emit(event, {payload})
    }

    if (ch === 'private') {
        let to = findUser(user, account_id)
        if (to) {
            io.to(to.socket_id).emit('me', {event, payload})
        }
    }
})
//////////////////////////////////////////////////////////////////////

server.listen(3000, () => {
    console.log('Socket.IO is running on 3000')
})

//------!!!!!!!!!!!!!!!!!!!!!!11
function findUser(user, account_id) {
    return users.find(search => search.user.id === user.id && search.account_id === account_id)
}

function findSocket(socket_id) {
    return users.find(search => search.socket_id === socket_id)
}

//redis.subscribe('socketio')
io.on("connection", function(socket) {
    console.log("Socket connected =>", socket.id)

    // Agrupando usuarios por contas do GerentePRO
    socket.on('UserLogged', ({user, account}) => {
        socket.join(`account_${account.id}`)
        const userAccount = findUser(user, account.id)

        io.to(`account_${account.id}`).emit('UserLoggedIn', user)

        if (userAccount) {
            userAccount.socket_id = socket.id
        } else {
            users.push({ account_id: account.id, socket_id: socket.id, user })
            // Avisar todos os usuários logados (na conta) que alguém entrou
        }
    })

    socket.on('UserLogout', ({user, account}) => {
        io.to(`account_${account.id}`).emit('UserExited', user)
        socket.leave(`account_${account.id}`)

        let search = findUser(user, account.id)
        const i = users.indexOf(search)
        users.splice(i, 1)
    })
    // ------------------------------------------------
    socket.on("disconnect", () => {
        console.log("Socket disconnected => "+ socket.id)
        let user = findSocket(socket.id)
        const i = users.indexOf(user)

        users.splice(i, 1)
    })
})