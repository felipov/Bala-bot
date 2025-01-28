const Discord = require("discord.js");
const cor = require("../../config").discord.color;
const { addStaff } = require('../../Handler/staffHandler');
const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require("quick.db");
const { join } = require("path");

const db = {
  staffs: new QuickDB({ table: "staffs", filePath: join(process.cwd(), "database/staffs.sqlite") }),
};

module.exports = {
  name: "dbremovestaff",
  description: "Remove um staff da database",
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "staff_user",
      description: "Mencione o staff a ser removido",
      type: Discord.ApplicationCommandOptionType.User,
      required: true,
    },
  ],

  run: async (client, interaction) => {
    try {
      // Verificar se o comando está sendo usado em um servidor
      if (!interaction.guild) {
        return interaction.reply({
          content: "Este comando só pode ser usado em um servidor.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      const member = interaction.member;

      // Verificar permissões do membro
      if (!member.permissions || !member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          content: "Você não tem permissão para executar este comando.",
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Obter o usuário do staff a ser removido
      const staffUser = interaction.options.getUser("staff_user");

      // Verificar se o staff está registrado na base de dados
      const existingStaff = await db.staffs.all();
      const staffData = existingStaff.find(staff => staff.value.id === staffUser.id);

      if (!staffData) {
        return interaction.reply({
          content: `O usuário **${staffUser}** não está registrado como staff.`,
          flags: Discord.MessageFlags.Ephemeral,
        });
      }

      // Remover o staff da base de dados usando o ID do staff
      await db.staffs.delete(staffData.id);

      // Atualiza a lista de staffs
      await addStaff(interaction.client);

      // Responder confirmando a remoção
      return interaction.reply({
        embeds: [
          new Discord.EmbedBuilder()
            .setColor(cor)
            .setTitle("Staff removido")
            .setDescription(`> **Usuário:** ${staffUser}\n> **ID Staff:** ${staffData.id}`)
            .setFooter({ text: "Clube do Bala", iconURL: "https://cdn.discordapp.com/emojis/1305569586355109929.png?size=2048" })
        ]
      });
    } catch (error) {
      console.error("Erro ao executar o comando de remover staff:", error);
      return interaction.reply({
        content: "Ocorreu um erro ao executar o comando. Tente novamente mais tarde.",
        flags: Discord.MessageFlags.Ephemeral,
      });
    }
  },
};
