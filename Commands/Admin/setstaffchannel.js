const Discord = require("discord.js");
const { QuickDB } = require('quick.db');
const { join } = require("path");
const { permission } = require('process');

const db = {
  channels: new QuickDB({ table: "channels", filePath: join(process.cwd(), "database/channels.sqlite") }),
};

module.exports = {
  name: 'setstaffchannel',
  description: 'Define o canal onde a lista de staffs será exibida.',
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'canal',
      description: 'O canal para exibir a lista de staffs.',
      type: Discord.ApplicationCommandOptionType.Channel,
      required: true,
    }
  ],

  run: async (client, interaction) => {
    // Obtem o canal da opção fornecida pelo usuário
    const channel = interaction.options.getChannel("canal");

    // Verifica se o canal é válido, baseado no tipo, e pertence ao servidor
    if (!channel || !channel.isTextBased() || !channel.guild) {
      return interaction.reply({
        content: "Por favor, selecione um canal de texto válido.",
        ephemeral: true,
      });
    }
    
    // Salvar o canal no banco de dados
    await db.channels.set('staffChannelId', channel.id);

    await interaction.reply({
      content: `Canal definido para exibir a lista de staffs: ${channel}`,
      flags: Discord.MessageFlags.Ephemeral,
    });

  }
}
