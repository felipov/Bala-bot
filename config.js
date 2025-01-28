require('dotenv').config()

const config = {
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    color: 'AE3EDB'
  }
}

module.exports = config