const Discord = require("discord.js");
const cor = require("../../config").discord.color;
const { QuickDB } = require("quick.db");
const { join } = require("path");

// Configuração do banco de dados
const db = {
  staffs: new QuickDB({ 
    table: "staffs", 
    filePath: join(process.cwd(), "database/staffs.sqlite") 
  }),
};

module.exports = {
  name: 'infostaff',
  description: 'Mostra as infos de um staff',
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'staff_user',
      description: 'Mencione o staff',
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    }
  ],

  run: async (client, interaction) => {
    try {
      // Verifica se o comando está sendo usado em um servidor
      if (!interaction.guild) {
        return interaction.reply({
          content: "Este comando só pode ser usado em um servidor.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Obter o usuário do staff a ser consultado
      const staffUser = interaction.options.getUser("staff_user");

      // Verificar se o staff está registrado na base de dados
      const existingStaff = await db.staffs.all();
      const staffData = existingStaff.find(staff => staff.value.id === staffUser.id);

      if (!staffData) {
        return interaction.reply({
          content: `O usuário **${staffUser.username}** não está registrado como staff.`,
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Recuperar as informações do staff
      const { id: staffIndex, value } = staffData;
      const { name, average = 0, totalEvaluations = 0 } = value;

      // Criar a embed com as informações
      const embed = new Discord.EmbedBuilder()
        .setColor(cor)
        .setTitle('Informações do Staff')
        .setThumbnail(staffUser.displayAvatarURL()) // Thumbnail do staff, não do bot
        .addFields(
          { name: 'Nome', value: name || 'Não definido', inline: true },
          { name: 'ID', value: staffIndex, inline: true },
          { name: 'Número de Avaliações', value: totalEvaluations.toString(), inline: true },
          { name: 'Média de Avaliações', value: average.toString(), inline: true }
        )
        .setFooter({ text: "Clube do Bala", iconURL: "https://cdn.discordapp.com/emojis/1305569586355109929.png?size=2048" });

      // Criar o botão para mostrar as avaliações
      const button = new Discord.ButtonBuilder()
        .setCustomId('showEvaluations')
        .setEmoji('📝')
        .setLabel('Ver avaliações')
        .setStyle(Discord.ButtonStyle.Primary);

      // Enviar a embed com o botão
      await interaction.reply({
        embeds: [embed],
        components: [
          new Discord.ActionRowBuilder().addComponents(button)
        ]
      });

    } catch (error) {
      // Erro na execução do comando
      console.error("Erro ao executar o comando de infostaff:", error);
      return interaction.reply({
        content: "Ocorreu um erro ao executar o comando. Tente novamente mais tarde.",
        flags: Discord.MessageFlags.Ephemeral,
      });
    }
  }
};
