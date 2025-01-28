const Discord = require('discord.js')
const cor = require('../../config').discord.color

module.exports = {
  name: 'ping',
  description: 'Veja o meu ping!',
  type: Discord.ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    const embed = new Discord.EmbedBuilder()
      .setColor(cor)
      .setTitle(`Olá, ${interaction.user.username}`)
      .setDescription(`Meu ping está em \`${client.ws.ping}ms\`.`)

    interaction.reply({ embeds: [embed] })
  }
}